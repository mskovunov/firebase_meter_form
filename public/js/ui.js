// js/ui.js

export const translations = {
    ru: {
        subtitle: "Система мониторинга", loading: "Загрузка...", wait: "Ожидание данных", 
        powerOn: "Питание ЕСТЬ", powerOff: "Питание ОТСУТСТВУЕТ", subOn: "Работа от сети 220В", subOff: "Работа от аккумулятора", 
        battery: "Заряд АКБ", event: "Событие", history: "История событий", updated: "Обновлено", error: "Ошибка доступа", noData: "Нет данных", 
        lastOn: "Посл. ВКЛ", lastOff: "Посл. ВЫКЛ", mHome: "Главная", mMonitoring: "Энергомониторинг", mGraphs: "Графики", mSettings: "Настройки", mAbout: "О системе", 
        gTitle: "График заряда/разряда АКБ", gStatsTitle: "Наличие света (часы по дням)", statOn: "Есть свет", statOff: "Нет света", hShort: "ч", mShort: "мин", 
        dataInfo: "Данные за последние ~48 часов",
        monVoltage: "Напряжение", monPower: "Мощность", monEnergy: "Счетчик", monDaily: "Сегодня",
        btnDay: "День", btnWeek: "Неделя", btnMonth: "Месяц",
        cVoltage: "Напряжение (V)", cPower: "Мощность (W)", cDaily: "За сегодня (kWh)",
        cEnergyDay: "Потребление по дням (kWh)", cEnergyWeek: "Потребление по неделям (kWh)", cEnergyMonth: "Потребление по месяцам (kWh)",
        stTitle: "Интервал обновления", stDesc: "Как часто устройство отправляет данные (сек).", 
        btnSave: "Сохранить", stInfo: "Изменения вступят в силу после следующего сеанса связи.",
        msgSaved: "Сохранено успешно!", msgError: "Ошибка сохранения",
        monLogsTitle: "Системные логи", 
        lblReason: "Причина:",
        stPzemTitle: "Интервал счетчика", stPzemDesc: "Как часто отправляются данные напряжения и мощности (сек).", 
        btnSavePzem: "Сохранить", stPzemInfo: "Изменения вступят в силу после следующего сеанса связи."
    },
    uk: {
        subtitle: "Система моніторингу", loading: "Завантаження...", wait: "Очікування даних", 
        powerOn: "Світло Є", powerOff: "Світла НЕМАЄ", subOn: "Робота від мережі 220В", subOff: "Робота від акумулятора", 
        battery: "Заряд АКБ", event: "Подія", history: "Історія подій", updated: "Оновлено", error: "Помилка доступу", noData: "Немає даних", 
        lastOn: "Ост. УВІМК", lastOff: "Ост. ВИМК", mHome: "Головна", mMonitoring: "Енергомоніторинг", mGraphs: "Графіки", mSettings: "Налаштування", mAbout: "Про систему", 
        gTitle: "Графік заряду/розряду АКБ", gStatsTitle: "Наявність світла (години по днях)", statOn: "Є світло", statOff: "Немає світла", hShort: "год", mShort: "хв", 
        dataInfo: "Дані за останні ~48 годин",
        monVoltage: "Напруга", monPower: "Потужність", monEnergy: "Лічильник", monDaily: "Сьогодні",
        btnDay: "День", btnWeek: "Тиждень", btnMonth: "Місяць",
        cVoltage: "Напруга (V)", cPower: "Потужність (W)", cDaily: "За сьогодні (kWh)",
        cEnergyDay: "Споживання по днях (kWh)", cEnergyWeek: "Споживання по тижнях (kWh)", cEnergyMonth: "Споживання по місяцях (kWh)",
        stTitle: "Інтервал оновлення", stDesc: "Як часто пристрій надсилає дані (сек).", 
        btnSave: "Зберегти", stInfo: "Зміни набудуть чинності після наступного сеансу зв'язку.",
        msgSaved: "Збережено успішно!", msgError: "Помилка збереження",
        monLogsTitle: "Системні логи", 
        lblReason: "Причина:",
        stPzemTitle: "Інтервал лічильника", stPzemDesc: "Як часто надсилаються дані напруги та потужності (сек).", 
        btnSavePzem: "Зберегти", stPzemInfo: "Зміни набудуть чинності після наступного сеансу зв'язку."
    },
    en: {
        subtitle: "Monitoring System", loading: "Loading...", wait: "Waiting for data", 
        powerOn: "Power ON", powerOff: "Power OFF", subOn: "Main grid 220V active", subOff: "Running on battery", 
        battery: "Battery Level", event: "Event", history: "Event History", updated: "Updated", error: "Access Error", noData: "No Data", 
        lastOn: "Last ON", lastOff: "Last OFF", mHome: "Home", mMonitoring: "Energy Monitor", mGraphs: "Charts", mSettings: "Settings", mAbout: "About", 
        gTitle: "Battery Charge/Discharge Chart", gStatsTitle: "Power Availability (Hours/Day)", statOn: "Power ON", statOff: "Power OFF", hShort: "h", mShort: "m", 
        dataInfo: "Data for the last ~48 hours",
        monVoltage: "Voltage", monPower: "Power", monEnergy: "Meter", monDaily: "Today",
        btnDay: "Day", btnWeek: "Week", btnMonth: "Month",
        cVoltage: "Voltage (V)", cPower: "Power (W)", cDaily: "Today (kWh)",
        cEnergyDay: "Consumption by day (kWh)", cEnergyWeek: "Consumption by week (kWh)", cEnergyMonth: "Consumption by month (kWh)",
        stTitle: "Update Interval", stDesc: "How often the device sends data (sec).", 
        btnSave: "Save", stInfo: "Changes will take effect after the next device connection.",
        msgSaved: "Saved successfully!", msgError: "Error saving",
        monLogsTitle: "System Logs", 
        lblReason: "Reason:",
        stPzemTitle: "Meter Interval", stPzemDesc: "How often voltage and power data is sent (sec).", 
        btnSavePzem: "Save", stPzemInfo: "Changes will take effect after the next connection."
    }
};

export function initUI(config) {
    // Setup Navigation
    const navs = ['home', 'monitoring', 'graphs', 'settings'];
    navs.forEach(view => {
        const navEl = document.getElementById(`nav-${view}`);
        if(navEl) {
            navEl.addEventListener('click', () => config.onViewChange(view));
        }
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
    const views = ['home', 'monitoring', 'graphs', 'settings'];

    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) {
            if (v === viewName) {
                el.classList.remove('hidden');
                setTimeout(() => el.classList.remove('opacity-0'), 10);
                el.classList.add('flex');
            } else {
                el.classList.add('hidden', 'opacity-0');
                el.classList.remove('flex');
            }
        }
    });

    const activeClasses = ['bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-600', 'dark:text-blue-400'];
    const inactiveClasses = ['text-gray-700', 'dark:text-gray-200', 'hover:bg-gray-100', 'dark:hover:bg-gray-800'];

    views.forEach(v => {
        const btn = document.getElementById(`nav-${v}`);
        if (btn) {
            if (v === viewName) {
                btn.classList.add(...activeClasses);
                btn.classList.remove(...inactiveClasses);
            } else {
                btn.classList.remove(...activeClasses);
                btn.classList.add(...inactiveClasses);
            }
        }
    });

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menu-overlay');
    if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden', 'opacity-0');
    }
}

export function applyLanguage(lang) {
    const t = translations[lang];
    document.getElementById("lang-select").value = lang;
    
    const ids = {
        't-subtitle': t.subtitle, 't-battery': t.battery, 't-event': t.event,
        't-history': t.history, 't-last-on': t.lastOn, 't-last-off': t.lastOff,
        't-graph-title': t.gTitle, 't-stats-title': t.gStatsTitle, 't-data-info': t.dataInfo,
        'm-home': t.mHome, 'm-monitoring': t.mMonitoring, 'm-graphs': t.mGraphs, 
        'm-settings': t.mSettings, 'm-about': t.mAbout,
        't-mon-voltage': t.monVoltage, 't-mon-power': t.monPower, 't-mon-energy': t.monEnergy, 't-mon-daily': t.monDaily,
        'btn-range-day': t.btnDay, 'btn-range-week': t.btnWeek, 'btn-range-month': t.btnMonth,
        't-set-interval-title': t.stTitle,
        't-set-desc': t.stDesc,
        't-btn-save': t.btnSave,
        't-set-info': t.stInfo,
        't-mon-logs-title': t.monLogsTitle,
        't-set-pzem-title': t.stPzemTitle,
        't-set-pzem-desc': t.stPzemDesc,
        't-btn-save-pzem': t.btnSavePzem,
        't-set-pzem-info': t.stPzemInfo
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
        
        let timeStr = "--:--:--"; 
        if (data.timestamp && data.timestamp.toDate) {
            timeStr = data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        
        let borderClass = 'border-gray-300';
        if (evt === "PowerRestored") borderClass = 'border-green-500'; 
        else if (evt === "PowerLost") borderClass = 'border-red-500'; 
        else if (evt === "RoutineCheck") borderClass = 'border-blue-300';
        
        const volStr = data.voltage !== undefined ? ` | <span class="text-gray-600 dark:text-gray-300 font-bold">${data.voltage}V</span>` : '';

        listHTML += `
        <li class="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border-l-4 ${borderClass} transition hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex-grow">
                <div class="font-medium text-gray-700 dark:text-gray-200">${evt}</div>
                <div class="text-xs text-gray-400">
                    Bat: ${data.battery}%${volStr} | Val: ${data.value}
                </div>
            </div>
            <span class="text-gray-500 dark:text-gray-400 text-xs font-mono bg-gray-200 dark:bg-gray-900 px-2 py-1 rounded">
                ${timeStr}
            </span>
        </li>`;
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

// === НОВИЙ ДИЗАЙН ЛОГІВ (З додаванням дати) ===
export function renderSystemLogs(docs) {
    const listContainer = document.getElementById('system-logs-list');
    if (!listContainer) return;

    if (!docs || docs.length === 0) {
        listContainer.innerHTML = `<li class="p-4 text-center text-sm text-gray-400">Немає записів</li>`;
        return;
    }

    const t = translations[localStorage.getItem('lang') || 'uk']; 
    let html = '';
    
    docs.forEach(doc => {
        // 1. Форматуємо ЧАС та ДАТУ окремо
        let timeStr = "--:--:--";
        let dateStr = "";
        
        if (doc.timestamp && doc.timestamp.toDate) {
            const dateObj = doc.timestamp.toDate();
            timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            // Формат дати: 23.02
            dateStr = String(dateObj.getDate()).padStart(2, '0') + '.' + String(dateObj.getMonth() + 1).padStart(2, '0');
        } else if (doc.created_at) {
            // Якщо час приходить текстом "2026-02-23 14:30:00"
            if (doc.created_at.includes(' ')) {
                const parts = doc.created_at.split(' ');
                timeStr = parts[1]; // "14:30:00"
                
                const dateParts = parts[0].split('-'); // ["2026", "02", "23"]
                if (dateParts.length === 3) {
                    dateStr = `${dateParts[2]}.${dateParts[1]}`; // "23.02"
                } else {
                    dateStr = parts[0];
                }
            } else {
                timeStr = doc.created_at;
            }
        }

        // 2. Колір лівої смужки та тексту
        const level = (doc.level || doc.type || "INFO").toUpperCase();
        let borderClass = "border-blue-400"; 
        let textLevelClass = "text-blue-600 dark:text-blue-400";

        if (level === "ERROR") {
            borderClass = "border-red-500";
            textLevelClass = "text-red-600 dark:text-red-400";
        } else if (level === "WARN" || level === "WARNING") {
            borderClass = "border-yellow-500";
            textLevelClass = "text-yellow-600 dark:text-yellow-400";
        }

        // 3. Збираємо повідомлення
        const msg = doc.message || doc.event || doc.text || JSON.stringify(doc);
        const reason = doc.reason ? doc.reason.trim() : "";
        const subText = reason ? `<span class="font-semibold text-gray-500 dark:text-gray-400">${t.lblReason}</span> ${reason}` : "Системне повідомлення";

        // 4. Формуємо HTML (Дата зверху, час у сірому блоці знизу)
        html += `
        <li class="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border-l-4 ${borderClass} transition hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex-grow pr-2">
                <div class="font-bold ${textLevelClass}">
                    ${level} <span class="font-medium text-gray-700 dark:text-gray-200">| ${msg}</span>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">
                    ${subText}
                </div>
            </div>
            
            <div class="flex flex-col items-end flex-shrink-0">
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1 tracking-wider">${dateStr}</span>
                <span class="text-gray-500 dark:text-gray-400 text-xs font-mono bg-gray-200 dark:bg-gray-900 px-2 py-1 rounded whitespace-nowrap">
                    ${timeStr}
                </span>
            </div>
        </li>`;
    });
    
    listContainer.innerHTML = html;
}