// js/app.js
import { db } from './config.js';
import * as UI from './ui.js';
import * as Charts from './charts.js';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// State
let currentDocs = [];
let currentLang = localStorage.getItem('lang') || 'uk';
let todayStartEnergy = null;
let monUnsubscribe = null;
let monDataCache = [];
let historyCache = [];
let isHistoryLoaded = false;
let activeMonMode = 'power'; // Запоминаем текущий режим (по умолчанию Power)

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
    startMainListener();
    
    window.setMonChartMode = (mode) => {
        handleChartModeChange(mode);
    };
    
    window.changeEnergyRange = (range) => {
        Charts.changeEnergyRange(range);
    };
});

// === LOGIC ===

function handleViewChange(viewName) {
    UI.showView(viewName);
    
    if (viewName === 'monitoring') {
        startMonitoringListener();
        // Убрали принудительный вызов handleChartModeChange отсюда,
        // чтобы не рисовать пустой график до загрузки данных.
        // Отрисовка произойдет сама внутри startMonitoringListener -> onSnapshot
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
        document.getElementById('mon-status-text').innerText = `Оновлено: ${new Date().toLocaleTimeString()}`;
    }
}

async function loadHistoryData() {
    try {
        const qHistory = query(collection(db, "meter_readings"), orderBy("created_at", "desc"), limit(3000));
        const snapshot = await getDocs(qHistory);
        
        if (!snapshot.empty) {
            historyCache = snapshot.docs.map(doc => doc.data());
            isHistoryLoaded = true;
            console.log("History loaded:", historyCache.length);
        }
    } catch (e) {
        console.error("Error loading history:", e);
    }
}

function startMainListener() {
    const q = query(collection(db, "esp32_data"), orderBy("timestamp", "desc"), limit(288));
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            currentDocs = snapshot.docs.map(doc => doc.data());
            refreshData();
        }
    }, (err) => console.error("Main Listener Error:", err));
}

function refreshData() {
    if(currentDocs.length > 0) {
        UI.renderHome(currentDocs, currentLang);
        Charts.updateMainChart(currentDocs);
        Charts.updateStatsChart(currentDocs, UI.translations, currentLang);
    }
}

// === MONITORING LOGIC ===
async function fetchTodayStart() {
    const now = new Date();
    const dateString = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    const startOfDayStr = dateString + " 00:00:00";
    const qDaily = query(collection(db, "meter_readings"), where("created_at", ">=", startOfDayStr), orderBy("created_at", "asc"), limit(1));
    try {
       const snap = await getDocs(qDaily);
       if(!snap.empty) {
           todayStartEnergy = snap.docs[0].data().energy;
       }
    } catch(e) { console.log("Daily fetch error", e); }
}

function startMonitoringListener() {
    if(monUnsubscribe) return; 

    fetchTodayStart();
    
    const qMon = query(collection(db, "meter_readings"), orderBy("created_at", "desc"), limit(200));
    
    monUnsubscribe = onSnapshot(qMon, (snapshot) => {
        if(snapshot.empty) {
            document.getElementById('mon-status-text').innerText = "Немає даних лічильника";
            return;
        }
        
        const docs = snapshot.docs.map(doc => doc.data());
        
        // Оновлюємо кеш живих даних
        monDataCache = docs.reverse(); 
        const latest = monDataCache[monDataCache.length - 1];
        
        UI.updateMonitoringCards(latest, todayStartEnergy);
        
        // ВАЖЛИВО: Як тільки прийшли дані - оновлюємо графік
        // Але тільки якщо ми не в режимі історії (бо там дані статичні)
        if (activeMonMode !== 'energy') {
            Charts.setMonChartMode(activeMonMode, monDataCache, todayStartEnergy);
            document.getElementById('mon-status-text').innerText = `Оновлено: ${new Date().toLocaleTimeString()}`;
        }

    }, (err) => console.error("Mon Error", err));
}