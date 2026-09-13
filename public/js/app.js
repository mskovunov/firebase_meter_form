// js/app.js
import { db } from './config.js';
import * as UI from './ui.js?v=3';
import * as Charts from './charts.js?v=3';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// State
let currentDocs = [];
let currentLang = localStorage.getItem('lang') || 'uk';
let todayStartEnergy = null;
let monUnsubscribe = null;
let monDataCache = [];
let historyCache = [];
let isHistoryLoaded = false;
let activeMonMode = 'power'; // Запоминаем текущий режим (по умолчанию Power)
let logsUnsubscribe = null; // НОВА ЗМІННА  для відписки від логів

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
    }

    UI.initUI({
        onViewChange: handleViewChange,
        onLangChange: (lang) => {
            currentLang = lang;
            localStorage.setItem('lang', lang);
            UI.applyLanguage(lang);
            refreshData();
        },
        onThemeChange: () => {
           refreshData();
        }
    });

    UI.applyLanguage(currentLang);
    // ОТПРАВЛЯЕМ ПЕРЕВОДЫ В ГРАФИКИ
    Charts.updateChartConfig(UI.translations[currentLang]);
    startMainListener();
    
    window.setMonChartMode = (mode) => {
        handleChartModeChange(mode);
    };
    
    window.changeEnergyRange = (range) => {
        Charts.changeEnergyRange(range);
    };

    // 2. Експортуємо функції збереження у вікно
    window.saveSettings = () => {
        saveSettingsToDB();
    };
    // ДОДАНО: Експорт функції збереження PZEM
    window.savePzemSettings = () => {
        savePzemSettingsToDB();
    };
});

// === LOGIC ===

function handleViewChange(viewName) {
    UI.showView(viewName);
    
    if (viewName === 'monitoring') {
        startMonitoringListener();
        fetchTodayStart();
    }

    // 3. ЯКЩО ВІДКРИЛИ НАЛАШТУВАННЯ - ВАНТАЖИМО ДАНІ
    if (viewName === 'settings') { 
        loadSettingsFromDB();
    }
}

async function handleChartModeChange(mode) {
    activeMonMode = mode; // Обновляем текущий режим

    if (mode === 'energy') {
        if (!isHistoryLoaded) {
            document.getElementById('mon-status-text').innerText = "Завантаження історії...";
            await loadHistoryData();
        }
        Charts.setMonChartMode(mode, historyCache, todayStartEnergy);
        document.getElementById('mon-status-text').innerText = `Історія: ${historyCache.length} записів`;
    } else {
        // Для живых графиков используем кэш, если он есть
        Charts.setMonChartMode(mode, monDataCache, todayStartEnergy);
        document.getElementById('mon-status-text').innerText = `Оновлено: ${new Date().toLocaleTimeString([], { hour12: false })}`;
    }
}

async function loadHistoryData() {
    try {
        const qHistory = query(collection(db, "meter_readings"), orderBy("created_at", "desc"), limit(3000));
        const snapshot = await getDocs(qHistory);
        
        if (!snapshot.empty) {
            // ФИЛЬТРУЕМ: Оставляем только записи с адекватной энергией
            historyCache = snapshot.docs.map(doc => doc.data()).filter(d => d.energy >= 0.1);
            isHistoryLoaded = true;
            console.log("History loaded:", historyCache.length);
        }
    } catch (e) {
        console.error("Error loading history:", e);
    }
}

function startMainListener() {
    const q = query(collection(db, "esp32_data"), orderBy("timestamp", "desc"), limit(1200));
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            currentDocs = snapshot.docs.map(doc => doc.data());
            refreshData();
        }
    }, (err) => console.error("Main Listener Error:", err));
}

function refreshData() {
    // ОТПРАВЛЯЕМ ПЕРЕВОДЫ В ГРАФИКИ
    Charts.updateChartConfig(UI.translations[currentLang]);
    if(currentDocs.length > 0) {
        UI.renderHome(currentDocs, currentLang);
        Charts.updateMainChart(currentDocs);
        Charts.updateStatsChart(currentDocs, UI.translations, currentLang);
    }
}

// === MONITORING LOGIC ===
function refreshMonitoringCards() {
    if (monDataCache.length === 0) return;
    const latest = monDataCache[monDataCache.length - 1];
    UI.updateMonitoringCards(latest, todayStartEnergy);
    if (activeMonMode !== 'energy') {
        Charts.setMonChartMode(activeMonMode, monDataCache, todayStartEnergy);
    }
}

async function fetchTodayStart() {
    const now = new Date();
    const dateString = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    const startOfDayStr = dateString + " 00:00:00";
    const qDaily = query(collection(db, "meter_readings"), where("created_at", ">=", startOfDayStr), orderBy("created_at", "asc"), limit(200));
    try {
       const snap = await getDocs(qDaily);
       const firstValid = snap.docs.map(doc => doc.data()).find(d => Number(d.energy) >= 0.1);
       todayStartEnergy = firstValid ? Number(firstValid.energy) : null;
       refreshMonitoringCards();
    } catch(e) { console.log("Daily fetch error", e); }
}

function startMonitoringListener() {
    if(monUnsubscribe) return; 
    
    const qMon = query(collection(db, "meter_readings"), orderBy("created_at", "desc"), limit(200));
    
    monUnsubscribe = onSnapshot(qMon, (snapshot) => {
        if(snapshot.empty) {
            document.getElementById('mon-status-text').innerText = "Немає даних лічильника";
            return;
        }
        
        // ФИЛЬТРУЕМ ЖИВЫЕ ДАННЫЕ
        let docs = snapshot.docs.map(doc => doc.data()).filter(d => d.energy >= 0.1);
        
        // Если после фильтрации массив оказался пустым (пришли одни нули) - ничего не делаем
        if (docs.length === 0) return;
        
        // Оновлюємо кеш живих даних
        monDataCache = docs.reverse();
        refreshMonitoringCards();
        if (activeMonMode !== 'energy') {
            document.getElementById('mon-status-text').innerText = `Оновлено: ${new Date().toLocaleTimeString([], { hour12: false })}`;
        }

    }, (err) => console.error("Mon Error", err));

    // === НОВИЙ БЛОК: СЛУХАЧ ЛОГІВ ===
    const qLogs = query(collection(db, "system_logs"), orderBy("created_at", "desc"), limit(10));
    
    logsUnsubscribe = onSnapshot(qLogs, (snapshot) => {
        const logsDocs = snapshot.docs.map(doc => doc.data());
        UI.renderSystemLogs(logsDocs);
    }, (err) => {
        console.error("Помилка завантаження логів:", err);
    });
    
}

// === SETTINGS LOGIC ===

// Назви в базі даних 
const SETTINGS_COLLECTION = "esp32_settings";
const CONFIG_DOC = "config";

async function loadSettingsFromDB() {
    const inputMain = document.getElementById('input-interval');
    const inputPzem = document.getElementById('input-pzem-interval'); // ДОДАНО
    
    // Блокуємо інпути поки вантажиться
    inputMain.disabled = true;
    inputMain.classList.add('opacity-50');
    if (inputPzem) {
        inputPzem.disabled = true;
        inputPzem.classList.add('opacity-50');
    }

    try {
        const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.update_interval) {
                inputMain.value = data.update_interval;
            }
            // ДОДАНО: Завантажуємо інтервал PZEM
            if (inputPzem && data.pzem_interval) {
                inputPzem.value = data.pzem_interval;
            }
        } else {
            console.log("No settings doc found!");
        }
    } catch (e) {
        console.error("Error loading settings:", e);
    } finally {
        inputMain.disabled = false;
        inputMain.classList.remove('opacity-50');
        if (inputPzem) {
            inputPzem.disabled = false;
            inputPzem.classList.remove('opacity-50');
        }
    }
}

async function saveSettingsToDB() {
    const input = document.getElementById('input-interval');
    const status = document.getElementById('settings-status');
    const newVal = parseInt(input.value);

    if (!newVal || newVal < 5) {
        alert("Value must be at least 5 seconds");
        return;
    }

    const btn = document.getElementById('btn-save-settings');
    const originalBtnText = btn.innerHTML;
    
    // UI Loading state
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC);
        
        // setDoc з {merge: true} створить документ, якщо його немає, або оновить поле
        await setDoc(docRef, { 
            update_interval: newVal,
            updated_at: new Date() // Корисно знати, коли міняли
        }, { merge: true });

        // Show success
        status.innerText = UI.translations[currentLang].msgSaved || "Saved!";
        status.className = "text-center text-sm font-medium h-5 transition-opacity opacity-100 text-green-500";
        
        setTimeout(() => {
            status.classList.add('opacity-0');
        }, 3000);

    } catch (e) {
        console.error("Error saving:", e);
        status.innerText = UI.translations[currentLang].msgError || "Error!";
        status.className = "text-center text-sm font-medium h-5 transition-opacity opacity-100 text-red-500";
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
}

// ДОДАНО: Збереження налаштувань PZEM
async function savePzemSettingsToDB() {
    const input = document.getElementById('input-pzem-interval');
    const status = document.getElementById('pzem-settings-status');
    const newVal = parseInt(input.value);

    if (!newVal || newVal < 5) {
        alert("Value must be at least 5 seconds");
        return;
    }

    const btn = document.getElementById('btn-save-pzem');
    const originalBtnText = btn.innerHTML;
    
    // UI Loading state
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC);
        
        await setDoc(docRef, { 
            pzem_interval: newVal, // Зберігаємо саме pzem_interval
            updated_at: new Date() 
        }, { merge: true });

        // Show success
        status.innerText = UI.translations[currentLang].msgSaved || "Saved!";
        status.className = "text-center text-sm font-medium h-5 transition-opacity opacity-100 text-green-500";
        
        setTimeout(() => {
            status.classList.add('opacity-0');
        }, 3000);

    } catch (e) {
        console.error("Error saving PZEM settings:", e);
        status.innerText = UI.translations[currentLang].msgError || "Error!";
        status.className = "text-center text-sm font-medium h-5 transition-opacity opacity-100 text-red-500";
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
}

// === ВРЕМЕННАЯ ФУНКЦИЯ ДЛЯ ОЧИСТКИ БАЗЫ ОТ НУЛЕЙ ===
window.cleanZeroEnergy = async () => {
    console.log("⏳ Шукаємо глючні записи (energy < 0.1)...");

    try {
        const q = query(collection(db, "meter_readings"), where("energy", "<", 0.1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("✅ Таких записів не знайдено. База чиста!");
            return;
        }

        console.log(`🗑️ Знайдено ${snapshot.size} записів. Починаємо видалення...`);

        let count = 0;
        for (const docSnap of snapshot.docs) {
            await deleteDoc(docSnap.ref);
            count++;
            if (count % 10 === 0) console.log(`Видалено ${count} з ${snapshot.size}...`);
        }

        console.log("🚀 Очищення успішно завершено! Онови сторінку (F5).");
    } catch (error) {
        console.error("❌ Помилка під час видалення:", error);
    }
};