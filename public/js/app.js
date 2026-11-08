// js/app.js
import { db } from './config.js';
import * as UI from './ui.js?v=13';
import * as Charts from './charts.js?v=14';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs, doc, getDoc, setDoc, startAfter } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// State
let currentDocs = [];
let currentLang = localStorage.getItem('lang') || 'uk';
let todayStartEnergy = null;
let monUnsubscribe = null;
let monDataCache = [];
let activeEnergyRange = 'day';
let energyLoadRequest = 0;
const energyRangeCache = new Map();
let activeMonMode = 'power'; // Запоминаем текущий режим (по умолчанию Power)
let logsUnsubscribe = null; // НОВА ЗМІННА  для відписки від логів
let graphDocs = [];
let graphsUnsubscribe = null;
let meterDocs = [];
let meterUnsubscribe = null;
let latestSupplyReading = null;
let supplyEdgeReadings = [];
let supplyEdgesUnsubscribe = null;
let supplyEdgeRequest = 0;
let cachedSupplyEdges = null;
let mainUnsubscribe = null;
let batteryCapacityKwh = 1.2;

const HOME_EVENT_LIMIT = 30;
const SUPPLY_EDGE_LIMIT = 120;
const LIVE_METER_LIMIT = 80;
const TODAY_START_LIMIT = 40;

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
    startSupplyEdgesListener();
    fetchTodayStart();
    loadSettingsFromDB();
    
    window.setMonChartMode = (mode) => {
        handleChartModeChange(mode);
    };
    
    window.changeEnergyRange = (range) => {
        handleEnergyRangeChange(range);
    };

    // 2. Експортуємо функції збереження у вікно
    window.saveSettings = () => {
        saveSettingsToDB();
    };
    // ДОДАНО: Експорт функції збереження PZEM
    window.savePzemSettings = () => {
        savePzemSettingsToDB();
    };
    window.saveBatteryCapacity = () => {
        saveBatteryCapacityToDB();
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

    if (viewName === 'graphs') {
        startGraphsListener();
    } else {
        stopGraphsListener();
    }
}

async function handleChartModeChange(mode) {
    activeMonMode = mode; // Обновляем текущий режим

    if (mode === 'energy') {
        Charts.setMonChartMode(mode, monDataCache, todayStartEnergy);
        await handleEnergyRangeChange(activeEnergyRange);
    } else {
        // Для живых графиков используем кэш, если он есть
        Charts.setMonChartMode(mode, monDataCache, todayStartEnergy);
        document.getElementById('mon-status-text').innerText = `Оновлено: ${new Date().toLocaleTimeString([], { hour12: false })}`;
    }
}

function getEnergyPeriods(range, now = new Date()) {
    const periods = [];
    const pad = value => String(value).padStart(2, '0');

    if (range === 'day') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        for (let offset = 6; offset >= 0; offset--) {
            const start = new Date(today);
            start.setDate(start.getDate() - offset);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            periods.push({
                start,
                end: end > now ? now : end,
                label: `${pad(start.getDate())}.${pad(start.getMonth() + 1)}`
            });
        }
    } else if (range === 'week') {
        const currentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const day = currentMonday.getDay() || 7;
        currentMonday.setDate(currentMonday.getDate() - day + 1);

        for (let offset = 7; offset >= 0; offset--) {
            const start = new Date(currentMonday);
            start.setDate(start.getDate() - offset * 7);
            const end = new Date(start);
            end.setDate(end.getDate() + 7);
            periods.push({
                start,
                end: end > now ? now : end,
                label: `${pad(start.getDate())}.${pad(start.getMonth() + 1)}`
            });
        }
    } else if (range === 'month') {
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        for (let offset = 11; offset >= 0; offset--) {
            const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - offset, 1);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
            periods.push({
                start,
                end: end > now ? now : end,
                label: `${pad(start.getMonth() + 1)}.${String(start.getFullYear()).slice(-2)}`
            });
        }
    }

    return periods;
}

async function fetchEnergyAt(boundary) {
    const unix = Math.floor(boundary.getTime() / 1000);
    const qBoundary = query(
        collection(db, "meter_readings"),
        where("timestamp_unix", "<=", unix),
        orderBy("timestamp_unix", "desc"),
        limit(5)
    );
    const snapshot = await getDocs(qBoundary);
    const valid = snapshot.docs
        .map(item => item.data())
        .filter(data => UI.isPlausibleMeterReading(data) && Number(data.energy) >= 0.1)
        .map(data => ({
            energy: Number(data.energy),
            timestampUnix: Number(data.timestamp_unix)
        }))
        .find(item => Number.isFinite(item.timestampUnix));
    return valid ?? null;
}

async function loadEnergyRange(range) {
    const periods = getEnergyPeriods(range);
    const boundaries = new Map();

    periods.forEach(period => {
        boundaries.set(period.start.getTime(), period.start);
        boundaries.set(period.end.getTime(), period.end);
    });

    const energyByBoundary = new Map();
    await Promise.all([...boundaries.entries()].map(async ([key, boundary]) => {
        energyByBoundary.set(key, await fetchEnergyAt(boundary));
    }));

    return periods.map(period => {
        const startReading = energyByBoundary.get(period.start.getTime());
        const endReading = energyByBoundary.get(period.end.getTime());
        const startEnergy = startReading?.energy ?? null;
        const endEnergy = endReading?.energy ?? null;
        const periodStartUnix = Math.floor(period.start.getTime() / 1000);
        const hasReadingInsidePeriod = endReading !== null && endReading.timestampUnix > periodStartUnix;
        const valid = hasReadingInsidePeriod && startEnergy !== null && endEnergy !== null && endEnergy >= startEnergy;
        return {
            label: period.label,
            value: valid ? Number((endEnergy - startEnergy).toFixed(3)) : null,
            startEnergy,
            endEnergy
        };
    });
}

async function handleEnergyRangeChange(range) {
    if (!['day', 'week', 'month'].includes(range)) return;

    const requestId = ++energyLoadRequest;
    activeEnergyRange = range;
    Charts.changeEnergyRange(range);

    const cached = energyRangeCache.get(range);
    if (cached) {
        Charts.setEnergyData(range, cached);
        document.getElementById('mon-status-text').innerText = `Періодів: ${cached.length}`;
        return;
    }

    document.getElementById('mon-status-text').innerText = "Завантаження історії...";

    try {
        const points = await loadEnergyRange(range);
        if (requestId !== energyLoadRequest) return;
        energyRangeCache.set(range, points);
        Charts.setEnergyData(range, points);
        document.getElementById('mon-status-text').innerText = `Періодів: ${points.length}`;
    } catch (error) {
        if (requestId !== energyLoadRequest) return;
        console.error("Error loading energy range:", error);
        document.getElementById('mon-status-text').innerText = "Помилка завантаження історії";
    }
}

function applyLatestSupply(readings) {
    const reading = readings.find(UI.isPlausibleMeterReading);
    if (!reading) return;
    latestSupplyReading = reading;
    UI.renderSupplyStatus(latestSupplyReading, currentLang);
    UI.renderReserveRuntime(latestSupplyReading, todayStartEnergy, currentLang, batteryCapacityKwh);
}

function startSupplyEdgesListener() {
    if (supplyEdgesUnsubscribe) return;
    const qEdges = query(collection(db, "meter_readings"), orderBy("timestamp_unix", "desc"), limit(SUPPLY_EDGE_LIMIT));
    supplyEdgesUnsubscribe = onSnapshot(qEdges, (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        const docs = snapshot.docs;
        supplyEdgeReadings = docs.map(item => item.data());
        applyLatestSupply(supplyEdgeReadings);
        const newest = supplyEdgeReadings.find(UI.isPlausibleMeterReading);
        const stateOn = newest ? Number(newest.voltage) >= 80 : null;
        if (cachedSupplyEdges?.complete && cachedSupplyEdges.stateOn === stateOn) {
            UI.renderSupplyEdgeResult(cachedSupplyEdges);
            return;
        }
        extendSupplyEdges(docs, stateOn);
    }, (err) => console.error("Supply edges listener error:", err));
}

async function extendSupplyEdges(docs, stateOn) {
    const requestId = ++supplyEdgeRequest;
    let combined = docs.map(item => item.data());
    let cursor = docs[docs.length - 1] || null;
    let exhausted = docs.length < SUPPLY_EDGE_LIMIT;
    const oldestAllowed = Math.floor(Date.now() / 1000) - 8 * 24 * 3600;
    let edges = UI.supplyEdgeTimes(combined, { historyExhausted: exhausted });
    UI.renderSupplyEdgeResult(edges);

    while (!edges.complete && !exhausted && cursor) {
        const oldest = Number(cursor.data().timestamp_unix);
        if (Number.isFinite(oldest) && oldest <= oldestAllowed) {
            edges = { ...UI.supplyEdgeTimes(combined), complete: true };
            break;
        }
        const older = await getDocs(query(
            collection(db, "meter_readings"),
            orderBy("timestamp_unix", "desc"),
            startAfter(cursor),
            limit(200)
        ));
        if (requestId !== supplyEdgeRequest) return;
        if (older.empty) {
            exhausted = true;
        } else {
            cursor = older.docs[older.docs.length - 1];
            combined = combined.concat(older.docs.map(item => item.data()));
            if (older.size < 200) exhausted = true;
        }
        edges = UI.supplyEdgeTimes(combined, { historyExhausted: exhausted });
        UI.renderSupplyEdgeResult(edges);
    }

    if (requestId !== supplyEdgeRequest) return;
    cachedSupplyEdges = { ...edges, stateOn };
    UI.renderSupplyEdgeResult(cachedSupplyEdges);
}

function startMainListener() {
    if (mainUnsubscribe) return;
    const q = query(collection(db, "esp32_data"), orderBy("timestamp", "desc"), limit(HOME_EVENT_LIMIT));
    mainUnsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            currentDocs = snapshot.docs.map(doc => doc.data());
            refreshData();
        }
    }, (err) => console.error("Main Listener Error:", err));
}

function sevenDaysStart() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return start;
}

function refreshGraphs() {
    const startMs = sevenDaysStart().getTime();
    const docs = graphDocs.filter(item => item.timestamp?.toDate && item.timestamp.toDate().getTime() >= startMs);
    if (!docs.length && !meterDocs.length) return;
    Charts.updateChartConfig(UI.translations[currentLang]);
    if (docs.length) Charts.updateMainChart(docs);
    if (meterDocs.length) Charts.updateStatsChart(meterDocs, UI.translations, currentLang);
    const info = document.getElementById('t-data-info');
    if (info) info.innerText = UI.translations[currentLang].dataInfo;
}

function stopGraphsListener() {
    if (graphsUnsubscribe) {
        graphsUnsubscribe();
        graphsUnsubscribe = null;
    }
    if (meterUnsubscribe) {
        meterUnsubscribe();
        meterUnsubscribe = null;
    }
}

function startGraphsListener() {
    if (graphsUnsubscribe) {
        refreshGraphs();
        return;
    }

    const info = document.getElementById('t-data-info');
    if (info) info.innerText = UI.translations[currentLang].loading;
    const qGraphs = query(
        collection(db, "esp32_data"),
        where("timestamp", ">=", sevenDaysStart()),
        orderBy("timestamp", "asc")
    );
    graphsUnsubscribe = onSnapshot(qGraphs, (snapshot) => {
        graphDocs = snapshot.docs.map(item => item.data());
        refreshGraphs();
    }, (err) => {
        console.error("Graphs listener error:", err);
        if (info) info.innerText = UI.translations[currentLang].error;
    });

    const startUnix = Math.floor(sevenDaysStart().getTime() / 1000);
    const qMeter = query(
        collection(db, "meter_readings"),
        where("timestamp_unix", ">=", startUnix),
        orderBy("timestamp_unix", "asc")
    );
    meterUnsubscribe = onSnapshot(qMeter, (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        meterDocs = snapshot.docs.map(item => item.data());
        refreshGraphs();
    }, (err) => console.error("Meter stats listener error:", err));
}

function refreshData() {
    // ОТПРАВЛЯЕМ ПЕРЕВОДЫ В ГРАФИКИ
    Charts.updateChartConfig(UI.translations[currentLang]);
    if(currentDocs.length > 0) {
        UI.renderHome(currentDocs, currentLang);
    }
    if (latestSupplyReading) {
        UI.renderSupplyStatus(latestSupplyReading, currentLang);
        UI.renderReserveRuntime(latestSupplyReading, todayStartEnergy, currentLang, batteryCapacityKwh);
    }
    if (cachedSupplyEdges) UI.renderSupplyEdgeResult(cachedSupplyEdges);
    if (graphDocs.length > 0 || meterDocs.length > 0) refreshGraphs();
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
    const qDaily = query(collection(db, "meter_readings"), where("created_at", ">=", startOfDayStr), orderBy("created_at", "asc"), limit(TODAY_START_LIMIT));
    try {
       const snap = await getDocs(qDaily);
       const firstValid = snap.docs.map(doc => doc.data()).find(d => UI.isPlausibleMeterReading(d) && Number(d.energy) >= 0.1);
       todayStartEnergy = firstValid ? Number(firstValid.energy) : null;
       refreshMonitoringCards();
       if (latestSupplyReading) UI.renderReserveRuntime(latestSupplyReading, todayStartEnergy, currentLang, batteryCapacityKwh);
    } catch(e) { console.log("Daily fetch error", e); }
}

function startMonitoringListener() {
    if(monUnsubscribe) return; 
    
    const qMon = query(collection(db, "meter_readings"), orderBy("created_at", "desc"), limit(LIVE_METER_LIMIT));
    
    monUnsubscribe = onSnapshot(qMon, (snapshot) => {
        if(snapshot.empty) {
            document.getElementById('mon-status-text').innerText = "Немає даних лічильника";
            return;
        }
        
        // ФИЛЬТРУЕМ ЖИВЫЕ ДАННЫЕ
        let docs = UI.filterMeterSeries(snapshot.docs.map(doc => doc.data()).reverse()).filter(d => d.energy >= 0.1);
        
        // Если после фильтрации массив оказался пустым (пришли одни нули) - ничего не делаем
        if (docs.length === 0) return;
        
        // Оновлюємо кеш живих даних
        monDataCache = docs;
        refreshMonitoringCards();
        if (activeMonMode === 'energy') {
            const cached = energyRangeCache.get(activeEnergyRange);
            const latestEnergy = Number(monDataCache[monDataCache.length - 1]?.energy);
            if (cached && Number.isFinite(latestEnergy)) {
                const updated = cached.map((point, index) => {
                    if (index !== cached.length - 1 || point.startEnergy === null || latestEnergy < point.startEnergy) {
                        return point;
                    }
                    return {
                        ...point,
                        endEnergy: latestEnergy,
                        value: Number((latestEnergy - point.startEnergy).toFixed(3))
                    };
                });
                energyRangeCache.set(activeEnergyRange, updated);
                Charts.setEnergyData(activeEnergyRange, updated);
            }
        } else {
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
    const inputPzem = document.getElementById('input-pzem-interval');
    const inputBattery = document.getElementById('input-battery-capacity');
    
    inputMain.disabled = true;
    inputMain.classList.add('opacity-50');
    if (inputPzem) {
        inputPzem.disabled = true;
        inputPzem.classList.add('opacity-50');
    }
    if (inputBattery) {
        inputBattery.disabled = true;
        inputBattery.classList.add('opacity-50');
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
            const capacity = Number(data.battery_capacity_kwh);
            if (Number.isFinite(capacity) && capacity > 0) {
                batteryCapacityKwh = capacity;
                if (inputBattery) inputBattery.value = capacity;
                if (latestSupplyReading) UI.renderReserveRuntime(latestSupplyReading, todayStartEnergy, currentLang, batteryCapacityKwh);
            } else if (inputBattery && !inputBattery.value) {
                inputBattery.value = batteryCapacityKwh;
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
        if (inputBattery) {
            inputBattery.disabled = false;
            inputBattery.classList.remove('opacity-50');
            if (!inputBattery.value) inputBattery.value = batteryCapacityKwh;
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

async function saveBatteryCapacityToDB() {
    const input = document.getElementById('input-battery-capacity');
    const status = document.getElementById('battery-settings-status');
    const newVal = Number(input.value);

    if (!Number.isFinite(newVal) || newVal < 0.1 || newVal > 100) {
        alert("Capacity must be between 0.1 and 100 kWh");
        return;
    }

    const btn = document.getElementById('btn-save-battery');
    const originalBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC);
        await setDoc(docRef, {
            battery_capacity_kwh: newVal,
            updated_at: new Date()
        }, { merge: true });

        batteryCapacityKwh = newVal;
        if (latestSupplyReading) UI.renderReserveRuntime(latestSupplyReading, todayStartEnergy, currentLang, batteryCapacityKwh);

        status.innerText = UI.translations[currentLang].msgSaved || "Saved!";
        status.className = "text-center text-sm font-medium h-5 transition-opacity opacity-100 text-green-500";
        setTimeout(() => status.classList.add('opacity-0'), 3000);
    } catch (e) {
        console.error("Error saving battery capacity:", e);
        status.innerText = UI.translations[currentLang].msgError || "Error!";
        status.className = "text-center text-sm font-medium h-5 transition-opacity opacity-100 text-red-500";
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
}
