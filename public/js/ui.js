// js/ui.js

export const translations = {
    ru: {
        subtitle: "Система мониторинга", loading: "Загрузка...", wait: "Ожидание данных", powerOn: "Питание ЕСТЬ", powerOff: "Питание ОТСУТСТВУЕТ", subOn: "Работа от сети 220В", subOff: "Работа от аккумулятора", battery: "Заряд АКБ", event: "Событие", history: "История событий", updated: "Обновлено", error: "Ошибка доступа", noData: "Нет данных", lastOn: "Посл. ВКЛ", lastOff: "Посл. ВЫКЛ", mHome: "Главная", mMonitoring: "Энергомониторинг", mGraphs: "Графики", mSettings: "Настройки", mAbout: "О системе", gTitle: "График заряда/разряда АКБ", gStatsTitle: "Наличие света (часы по дням)", statOn: "Есть свет", statOff: "Нет света", hShort: "ч", mShort: "мин", dataInfo: "Данные за последние ~48 часов"
    },
    uk: {
        subtitle: "Система моніторингу", loading: "Завантаження...", wait: "Очікування даних", powerOn: "Світло Є", powerOff: "Світла НЕМАЄ", subOn: "Робота від мережі 220В", subOff: "Робота від акумулятора", battery: "Заряд АКБ", event: "Подія", history: "Історія подій", updated: "Оновлено", error: "Помилка доступу", noData: "Немає даних", lastOn: "Ост. УВІМК", lastOff: "Ост. ВИМК", mHome: "Головна", mMonitoring: "Енергомоніторинг", mGraphs: "Графіки", mSettings: "Налаштування", mAbout: "Про систему", gTitle: "Графік заряду/розряду АКБ", gStatsTitle: "Наявність світла (години по днях)", statOn: "Є світло", statOff: "Немає світла", hShort: "год", mShort: "хв", dataInfo: "Дані за останні ~48 годин"
    },
    en: {
        subtitle: "Monitoring System", loading: "Loading...", wait: "Waiting for data", powerOn: "Power ON", powerOff: "Power OFF", subOn: "Main grid 220V active", subOff: "Running on battery", battery: "Battery Level", event: "Event", history: "Event History", updated: "Updated", error: "Access Error", noData: "No Data", lastOn: "Last ON", lastOff: "Last OFF", mHome: "Home", mMonitoring: "Energy Monitor", mGraphs: "Charts", mSettings: "Settings", mAbout: "About", gTitle: "Battery Charge/Discharge Chart", gStatsTitle: "Power Availability (Hours/Day)", statOn: "Power ON", statOff: "Power OFF", hShort: "h", mShort: "m", dataInfo: "Data for the last ~48 hours"
    }
};

export function initUI(config) {
    // Setup Navigation
    const navs = ['home', 'monitoring', 'graphs'];
    navs.forEach(view => {
        document.getElementById(`nav-${view}`).addEventListener('click', () => config.onViewChange(view));
    });
    document.getElementById('header-title-block').addEventListener('click', () => config.onViewChange('home'));

    // Sidebar
    const toggleMenu = (show) => {
        const sidebar = document.getElementById('sidebar');
        const menuOverlay = document.getElementById('menu-overlay');
        if (show) {
            menuOverlay.classList.remove('hidden');
            setTimeout(() => { menuOverlay.classList.remove('opacity-0'); sidebar.classList.remove('-translate-x-full'); }, 10);
        } else {
            sidebar.classList.add('-translate-x-full'); menuOverlay.classList.add('opacity-0');
            setTimeout(() => { menuOverlay.classList.add('hidden'); }, 300);
        }
    };
    document.getElementById('open-menu-btn').addEventListener('click', () => toggleMenu(true));
    document.getElementById('close-menu-btn').addEventListener('click', () => toggleMenu(false));
    document.getElementById('menu-overlay').addEventListener('click', () => toggleMenu(false));

    // Theme & Language
    document.getElementById("theme-toggle").addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.theme = isDark ? "dark" : "light";
        updateThemeIcon();
        config.onThemeChange();
    });
    
    document.getElementById("lang-select").addEventListener("change", (e) => {
        config.onLangChange(e.target.value);
    });

    // Initial Setup
    updateThemeIcon();
    
    // Accordion Logic (Global wrapper)
    window.toggleGraph = (contentId, iconId) => {
        const content = document.getElementById(contentId);
        const icon = document.getElementById(iconId);
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.classList.remove('collapsed');
        } else {
            content.classList.add('collapsed');
            icon.classList.add('collapsed');
        }
    };
}

export function showView(viewName) {
    ['home', 'graphs', 'monitoring'].forEach(v => {
        document.getElementById(`view-${v}`).classList.add('hidden');
        document.getElementById(`nav-${v}`).classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-600', 'dark:text-blue-400');
    });

    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    document.getElementById(`nav-${viewName}`).classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-600', 'dark:text-blue-400');
    
    // Close menu automatically on mobile
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('menu-overlay').classList.add('hidden');
}

export function applyLanguage(lang) {
    const t = translations[lang];
    document.getElementById("lang-select").value = lang;
    
    const ids = {
        't-subtitle': t.subtitle, 't-battery': t.battery, 't-event': t.event,
        't-history': t.history, 't-last-on': t.lastOn, 't-last-off': t.lastOff,
        't-graph-title': t.gTitle, 't-stats-title': t.gStatsTitle, 't-data-info': t.dataInfo,
        'm-home': t.mHome, 'm-monitoring': t.mMonitoring, 'm-graphs': t.mGraphs, 
        'm-settings': t.mSettings, 'm-about': t.mAbout
    };
    for (const [id, text] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if(el) el.innerText = text;
    }
}

function updateThemeIcon() {
    const themeIcon = document.getElementById("theme-icon");
    if (document.documentElement.classList.contains("dark")) {
        themeIcon.classList.remove("fa-moon"); themeIcon.classList.add("fa-sun");
    } else {
        themeIcon.classList.remove("fa-sun"); themeIcon.classList.add("fa-moon");
    }
}

export function renderHome(docs, currentLang) {
    const t = translations[currentLang];
    const latest = docs[0]; 
    const isPowerOn = latest.value === 1;
    const batLevel = latest.battery || 0;
    const eventType = latest.device || "Event";
    
    // Status Card
    const statusCard = document.getElementById("status-card");
    const statusText = document.getElementById("status-text");
    const statusSubtext = document.getElementById("status-subtext");
    const statusIconBg = document.getElementById("status-icon-bg");
    const statusPing = document.getElementById("status-ping");

    if (isPowerOn) {
        statusCard.className = "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center transition-colors duration-500 flex flex-col";
        statusText.className = "text-2xl font-bold text-green-700 dark:text-green-400"; 
        statusText.innerText = t.powerOn; statusSubtext.innerText = t.subOn;
        statusIconBg.className = "relative inline-flex rounded-full h-16 w-16 bg-green-500 items-center justify-center text-white text-2xl shadow-lg shadow-green-500/50";
        statusIconBg.innerHTML = '<i class="fas fa-bolt"></i>'; 
        statusPing.classList.remove("hidden");
    } else {
        statusCard.className = "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center transition-colors duration-500 flex flex-col";
        statusText.className = "text-2xl font-bold text-red-700 dark:text-red-400"; 
        statusText.innerText = t.powerOff; statusSubtext.innerText = t.subOff;
        statusIconBg.className = "relative inline-flex rounded-full h-16 w-16 bg-red-500 items-center justify-center text-white text-2xl shadow-lg shadow-red-500/50";
        statusIconBg.innerHTML = '<i class="fas fa-plug-circle-xmark"></i>'; 
        statusPing.classList.add("hidden");
    }

    // Battery
    const batteryBar = document.getElementById("battery-bar");
    document.getElementById("battery-percent").innerText = batLevel + "%"; 
    batteryBar.style.width = batLevel + "%";
    if (batLevel > 50) batteryBar.className = "bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-out";
    else if (batLevel > 20) batteryBar.className = "bg-yellow-500 h-4 rounded-full transition-all duration-1000 ease-out";
    else batteryBar.className = "bg-red-500 h-4 rounded-full transition-all duration-1000 ease-out";

    // Update Times
    let timeString = "--:--";
    if (latest.timestamp && latest.timestamp.toDate) timeString = latest.timestamp.toDate().toLocaleTimeString();
    document.getElementById("last-update").innerText = `${t.updated}: ${timeString}`;
    document.getElementById("last-event-type").innerText = eventType;

    const restoreDoc = docs.find(d => d.device === "PowerRestored");
    document.getElementById("time-last-on").innerText = (restoreDoc && restoreDoc.timestamp) ? restoreDoc.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

    const lostDoc = docs.find(d => d.device === "PowerLost");
    document.getElementById("time-last-off").innerText = (lostDoc && lostDoc.timestamp) ? lostDoc.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

    // History List
    let listHTML = "";
    docs.slice(0, 10).forEach((data) => {
        const evt = data.device || "Event";
        let timeStr = "--:--:--"; if (data.timestamp && data.timestamp.toDate) timeStr = data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        let borderClass = 'border-gray-300';
        if (evt === "PowerRestored") borderClass = 'border-green-500'; else if (evt === "PowerLost") borderClass = 'border-red-500'; else if (evt === "RoutineCheck") borderClass = 'border-blue-300';
        listHTML += `<li class="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border-l-4 ${borderClass} transition hover:bg-gray-100 dark:hover:bg-gray-700"><div class="flex-grow"><div class="font-medium text-gray-700 dark:text-gray-200">${evt}</div><div class="text-xs text-gray-400">Bat: ${data.battery}% | Val: ${data.value}</div></div><span class="text-gray-500 dark:text-gray-400 text-xs font-mono bg-gray-200 dark:bg-gray-900 px-2 py-1 rounded">${timeStr}</span></li>`;
    });
    document.getElementById("logs-list").innerHTML = listHTML;
}

export function updateMonitoringCards(latest, todayStartEnergy) {
    document.getElementById('mon-voltage').innerText = latest.voltage;
    document.getElementById('mon-power').innerText = latest.power;
    document.getElementById('mon-energy').innerText = latest.energy;

    if(todayStartEnergy !== null) {
        let daily = (latest.energy - todayStartEnergy).toFixed(3);
        if(daily < 0) daily = 0;
        document.getElementById('mon-daily').innerText = daily;
    }
}