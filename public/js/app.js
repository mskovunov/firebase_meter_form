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

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Theme
    if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
    }

    // 2. Init UI Handlers
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

    // 3. Apply Initial Lang
    UI.applyLanguage(currentLang);

    // 4. Start Main Listener (Home & Graphs)
    startMainListener();
    
    // 5. Expose specific functions to Window (for HTML onclicks)
    window.setMonChartMode = (mode) => {
        Charts.setMonChartMode(mode, monDataCache, todayStartEnergy);
    };
});


// === LOGIC ===

function handleViewChange(viewName) {
    UI.showView(viewName);
    
    if (viewName === 'monitoring') {
        startMonitoringListener();
    }
    // Resize charts if needed logic is inside charts.js update functions usually
}

function startMainListener() {
    const q = query(collection(db, "esp32_data"), orderBy("timestamp", "desc"), limit(288));
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            currentDocs = snapshot.docs.map(doc => doc.data());
            refreshData();
        } else {
            // Handle no data UI
        }
    }, (err) => console.error("Main Listener Error:", err));
}

function refreshData() {
    if(currentDocs.length > 0) {
        UI.renderHome(currentDocs, currentLang);
        Charts.updateMainChart(currentDocs);
        Charts.updateStatsChart(currentDocs, UI.translations, currentLang);
    }
    if(monDataCache.length > 0) {
        Charts.updateMonitoringChart(todayStartEnergy);
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
        
        document.getElementById('mon-status-text').innerText = `Оновлено: ${new Date().toLocaleTimeString()}`;
        const docs = snapshot.docs.map(doc => doc.data());
        
        // Cache and Update
        monDataCache = docs.reverse(); 
        const latest = monDataCache[monDataCache.length - 1]; // Newest is last because we reversed for chart
        
        UI.updateMonitoringCards(latest, todayStartEnergy);
        Charts.setMonChartMode('power', monDataCache, todayStartEnergy); // Default view
        
    }, (err) => console.error("Mon Error", err));
}