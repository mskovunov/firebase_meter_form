// js/ui.js

export const translations = {
    ru: {
        subtitle: "Система мониторинга", loading: "Загрузка...", wait: "Ожидание данных", 
        powerOn: "СВЕТ ЕСТЬ", powerReserve: "РЕЗЕРВ", powerOff: "СВЕТА НЕТ", subOn: "Городская сеть, инвертор на холостом ходу", subReserve: "Городской сети нет, работа от АКБ", subOff: "Нет сети и резерв не работает",
        runtimeTitle: "Запас LiFePO4", runtimeWait: "Считаю по сегодняшнему расходу...", runtimeNote: "Сегодня {today} кВт·ч из {capacity} · сейчас {power} Вт · осталось ≈ {time}",
        runtimeCharge: "ЗАРЯДКА", runtimeDischarge: "РАЗРЯД", runtimeIdle: "ПОКОЙ", runtimeNoLink: "НЕТ ДАННЫХ", unitW: "Вт",
        runtimeChargeNote: "Зарядки берут {power} Вт из линии щитка · {volt} В · {amp} А. Процент на клеммах розетка не измеряет.",
        runtimeIdleNote: "Линия есть, зарядки почти не потребляют.",
        runtimeNoLinkNote: "Жду показания розетки ecoFlow.",
        voltLabel: "Напряжение", powerLabel: "Мощность", 
        battery: "Заряд АКБ 18650", event: "Событие", history: "История событий", updated: "Обновлено", error: "Ошибка доступа", noData: "Нет данных", 
        lastOn: "Посл. ВКЛ", lastOff: "Посл. ВЫКЛ", mHome: "Главная", mMonitoring: "Энергомониторинг", mCharge: "Зарядка LiFePO", mGraphs: "Графики", mSettings: "Настройки", mAbout: "О системе",
        chargeWait: "ОЖИДАНИЕ", chargeOn: "ЗАРЯДКА", chargeIdle: "ПРОСТОЙ", chargeOff: "РОЗЕТКА ВЫКЛ", chargeStale: "НЕТ СВЯЗИ",
        chargeSubWait: "Розетка ecoFlow ещё не прислала показания",
        chargeSubOn: "Обе зарядки потребляют ток из линии щитка",
        chargeSubIdle: "Линия под напряжением, зарядки почти не потребляют",
        chargeSubOff: "Розетка разомкнута",
        chargeSubStale: "Свежих показаний розетки нет",
        chargeVoltage: "Напряжение линии", chargeCurrent: "Ток", chargePower: "Мощность", chargeEnergy: "Энергия",
        chargeNote: "Две зарядки, 25 А и 20 А, включены в одну розетку на линии щитка. Напряжение, ток и мощность — это сеть 230 В, не клеммы АКБ. Энергия — счётчик самой розетки в кВт·ч с последнего сброса, сайт его не вычисляет.",
        chargeUpdated: "Обновлено", chargeWaiting: "Ожидание данных...", 
        gTitle: "График заряда/разряда АКБ", gStatsTitle: "Наличие света (часы по дням)", statOn: "Свет есть", statReserve: "Резерв", statOff: "Света нет", hShort: "ч", mShort: "мин", 
        dataInfo: "Данные за последние 7 дней",
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
        btnSavePzem: "Сохранить", stPzemInfo: "Изменения вступят в силу после следующего сеанса связи.",
        stBatteryTitle: "Ёмкость АКБ 12В", stBatteryDesc: "Суммарная ёмкость всех батарей 12 В, кВт·ч.",
        btnSaveBattery: "Сохранить", stBatteryInfo: "Оценка запаса на главной пересчитывается сразу.",
        stPlugTitle: "Розетка зарядки", stPlugDesc: "Как часто опрашивать розетку ecoFlow и по какому адресу в сети.",
        btnSavePlug: "Сохранить", stPlugInfo: "Плата применит адрес и интервал со следующего опроса."
    },
    uk: {
        subtitle: "Система моніторингу", loading: "Завантаження...", wait: "Очікування даних", 
        powerOn: "СВІТЛО Є", powerReserve: "РЕЗЕРВ", powerOff: "СВІТЛА НЕМАЄ", subOn: "Міська мережа, інвертор на холостому ходу", subReserve: "Міської мережі немає, робота від АКБ", subOff: "Немає мережі і резерв не працює",
        runtimeTitle: "Запас LiFePO4", runtimeWait: "Рахую за сьогоднішнім споживанням...", runtimeNote: "Сьогодні {today} кВт·год із {capacity} · зараз {power} Вт · залишилось ≈ {time}",
        runtimeCharge: "ЗАРЯДКА", runtimeDischarge: "РОЗРЯД", runtimeIdle: "СПОКІЙ", runtimeNoLink: "НЕМАЄ ДАНИХ", unitW: "Вт",
        runtimeChargeNote: "Зарядки беруть {power} Вт з лінії щитка · {volt} В · {amp} А. Відсоток на клемах розетка не вимірює.",
        runtimeIdleNote: "Лінія є, зарядки майже не споживають.",
        runtimeNoLinkNote: "Чекаю на покази розетки ecoFlow.",
        voltLabel: "Напруга", powerLabel: "Потужність", 
        battery: "Заряд АКБ 18650", event: "Подія", history: "Історія подій", updated: "Оновлено", error: "Помилка доступу", noData: "Немає даних", 
        lastOn: "Ост. УВІМК", lastOff: "Ост. ВИМК", mHome: "Головна", mMonitoring: "Енергомоніторинг", mCharge: "Зарядка LiFePO", mGraphs: "Графіки", mSettings: "Налаштування", mAbout: "Про систему",
        chargeWait: "ОЧІКУВАННЯ", chargeOn: "ЗАРЯДКА", chargeIdle: "ПРОСТІЙ", chargeOff: "РОЗЕТКА ВИМК", chargeStale: "НЕМАЄ ЗВ'ЯЗКУ",
        chargeSubWait: "Розетка ecoFlow ще не надіслала показів",
        chargeSubOn: "Обидві зарядки беруть струм з лінії щитка",
        chargeSubIdle: "Лінія під напругою, зарядки майже не споживають",
        chargeSubOff: "Розетка розімкнена",
        chargeSubStale: "Свіжих показів розетки немає",
        chargeVoltage: "Напруга лінії", chargeCurrent: "Струм", chargePower: "Потужність", chargeEnergy: "Енергія",
        chargeNote: "Дві зарядки, 25 А і 20 А, включені в одну розетку на лінії щитка. Напруга, струм і потужність — це мережа 230 В, не клеми АКБ. Енергія — лічильник самої розетки в кВт·год з останнього скидання, сайт його не рахує.",
        chargeUpdated: "Оновлено", chargeWaiting: "Очікування даних...", 
        gTitle: "Графік заряду/розряду АКБ", gStatsTitle: "Наявність світла (години по днях)", statOn: "Світло є", statReserve: "Резерв", statOff: "Світла немає", hShort: "год", mShort: "хв", 
        dataInfo: "Дані за останні 7 днів",
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
        btnSavePzem: "Зберегти", stPzemInfo: "Зміни набудуть чинності після наступного сеансу зв'язку.",
        stBatteryTitle: "Ємність АКБ 12В", stBatteryDesc: "Сумарна ємність усіх батарей 12 В, кВт·год.",
        btnSaveBattery: "Зберегти", stBatteryInfo: "Оцінка запасу на головній перераховується одразу.",
        stPlugTitle: "Розетка зарядки", stPlugDesc: "Як часто опитувати розетку ecoFlow і за якою адресою в мережі.",
        btnSavePlug: "Зберегти", stPlugInfo: "Плата застосує адресу та інтервал з наступного опитування."
    },
    en: {
        subtitle: "Monitoring System", loading: "Loading...", wait: "Waiting for data", 
        powerOn: "GRID POWER", powerReserve: "BACKUP", powerOff: "NO POWER", subOn: "City grid present, inverter idling", subReserve: "City grid is down, running on the battery", subOff: "No grid and the backup is off",
        runtimeTitle: "LiFePO4 reserve", runtimeWait: "Calculating from today's use...", runtimeNote: "Today {today} kWh of {capacity} · now {power} W · about {time} left",
        runtimeCharge: "CHARGING", runtimeDischarge: "DISCHARGING", runtimeIdle: "IDLE", runtimeNoLink: "NO DATA", unitW: "W",
        runtimeChargeNote: "The chargers draw {power} W from the panel line · {volt} V · {amp} A. The plug does not measure cell percent.",
        runtimeIdleNote: "The line is live and the chargers are drawing almost nothing.",
        runtimeNoLinkNote: "Waiting for the ecoFlow plug.",
        voltLabel: "Voltage", powerLabel: "Power", 
        battery: "18650 battery", event: "Event", history: "Event History", updated: "Updated", error: "Access Error", noData: "No Data", 
        lastOn: "Last ON", lastOff: "Last OFF", mHome: "Home", mMonitoring: "Energy Monitor", mCharge: "LiFePO charging", mGraphs: "Charts", mSettings: "Settings", mAbout: "About",
        chargeWait: "WAITING", chargeOn: "CHARGING", chargeIdle: "IDLE", chargeOff: "PLUG OFF", chargeStale: "NO LINK",
        chargeSubWait: "The ecoFlow plug has not reported yet",
        chargeSubOn: "Both chargers are drawing from the panel line",
        chargeSubIdle: "The line is live, the chargers are drawing almost nothing",
        chargeSubOff: "The plug is off",
        chargeSubStale: "No fresh reading from the plug",
        chargeVoltage: "Line voltage", chargeCurrent: "Current", chargePower: "Power", chargeEnergy: "Energy",
        chargeNote: "Two chargers, 25 A and 20 A, share one plug on the panel line. Voltage, current and power are the 230 V mains, not the battery terminals. Energy is the plug's own kWh counter since its last reset; the site does not calculate it.",
        chargeUpdated: "Updated", chargeWaiting: "Waiting for data...", 
        gTitle: "Battery Charge/Discharge Chart", gStatsTitle: "Power Availability (Hours/Day)", statOn: "Grid power", statReserve: "Backup", statOff: "No power", hShort: "h", mShort: "m", 
        dataInfo: "Data for the last 7 days",
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
        btnSavePzem: "Save", stPzemInfo: "Changes will take effect after the next connection.",
        stBatteryTitle: "12V battery capacity", stBatteryDesc: "Total capacity of all 12V batteries, kWh.",
        btnSaveBattery: "Save", stBatteryInfo: "The home estimate updates immediately.",
        stPlugTitle: "Charging plug", stPlugDesc: "How often to poll the ecoFlow plug, and its address on the network.",
        btnSavePlug: "Save", stPlugInfo: "The board applies the address and interval on the next poll."
    }
};

export function initUI(config) {
    // Setup Navigation
    const navs = ['home', 'monitoring', 'charge', 'graphs', 'settings'];
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
    const views = ['home', 'monitoring', 'charge', 'graphs', 'settings'];

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
        't-subtitle': t.subtitle, 't-battery': t.battery, 't-reserve-runtime': t.runtimeTitle, 't-event': t.event,
        't-history': t.history, 't-last-on': t.lastOn, 't-last-off': t.lastOff,
        't-graph-title': t.gTitle, 't-stats-title': t.gStatsTitle, 't-data-info': t.dataInfo,
        'm-home': t.mHome, 'm-monitoring': t.mMonitoring, 'm-charge': t.mCharge, 'm-graphs': t.mGraphs, 
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
        't-set-pzem-info': t.stPzemInfo,
        't-set-battery-title': t.stBatteryTitle,
        't-set-battery-desc': t.stBatteryDesc,
        't-btn-save-battery': t.btnSaveBattery,
        't-set-battery-info': t.stBatteryInfo,
        't-set-plug-title': t.stPlugTitle,
        't-set-plug-desc': t.stPlugDesc,
        't-btn-save-plug': t.btnSavePlug,
        't-set-plug-info': t.stPlugInfo,
        't-charge-voltage': t.chargeVoltage, 't-charge-current': t.chargeCurrent,
        't-charge-power': t.chargePower, 't-charge-energy': t.chargeEnergy,
        'charge-note': t.chargeNote
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

const CHARGE_ACTIVE_WATTS = 10;
const CHARGE_FRESH_MS = 8 * 60 * 1000;

export function renderCharge(reading, lang) {
    const t = translations[lang] || translations.uk;
    const card = document.getElementById('charge-status-card');
    const icon = document.getElementById('charge-status-icon');
    const title = document.getElementById('charge-status-text');
    const sub = document.getElementById('charge-status-sub');
    const updated = document.getElementById('charge-updated');
    if (!card || !title) return;

    const paint = (tone, heading, detail) => {
        const tones = {
            green: ['bg-green-100', 'border-green-200', 'dark:bg-green-900/30', 'dark:border-green-800', 'bg-green-500', 'text-green-700', 'dark:text-green-300'],
            amber: ['bg-amber-100', 'border-amber-200', 'dark:bg-amber-900/30', 'dark:border-amber-800', 'bg-amber-500', 'text-amber-700', 'dark:text-amber-300'],
            gray: ['bg-gray-100', 'border-gray-200', 'dark:bg-gray-800', 'dark:border-gray-700', 'bg-gray-500', 'text-gray-700', 'dark:text-gray-300']
        };
        card.className = `rounded-2xl p-6 text-center border ${tones[tone].slice(0, 4).join(' ')}`;
        icon.className = `relative inline-flex rounded-full h-16 w-16 ${tones[tone][4]} items-center justify-center text-white text-2xl shadow-lg mb-4`;
        title.className = `text-2xl font-bold ${tones[tone][5]} ${tones[tone][6]}`;
        title.textContent = heading;
        sub.textContent = detail;
    };

    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    if (!reading) {
        paint('gray', t.chargeWait, t.chargeSubWait);
        setValue('charge-voltage', '--');
        setValue('charge-current', '--');
        setValue('charge-power', '--');
        setValue('charge-energy', '--');
        if (updated) updated.textContent = t.chargeWaiting;
        return;
    }

    const stamp = reading.timestamp && typeof reading.timestamp.toDate === 'function'
        ? reading.timestamp.toDate()
        : null;
    const fresh = stamp && (Date.now() - stamp.getTime()) < CHARGE_FRESH_MS;
    const power = Number(reading.power);
    const chargingNow = fresh && reading.on && power >= CHARGE_ACTIVE_WATTS;
    if (!fresh) paint('gray', t.chargeStale, t.chargeSubStale);
    else if (!reading.on) paint('gray', t.chargeOff, t.chargeSubOff);
    else if (chargingNow) paint('green', t.chargeOn, t.chargeSubOn);
    else paint('amber', t.chargeIdle, t.chargeSubIdle);

    const liveNumber = (value, digits) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '--';
    setValue('charge-voltage', fresh ? liveNumber(reading.voltage, 1) : '--');
    setValue('charge-current', chargingNow ? liveNumber(reading.current, 3) : '0.000');
    setValue('charge-power', chargingNow ? liveNumber(power, 1) : '0.0');
    setValue('charge-energy', liveNumber(reading.energy, 3));
    if (updated) {
        updated.textContent = stamp
            ? `${t.chargeUpdated}: ${stamp.toLocaleTimeString([], { hour12: false })}`
            : t.chargeWaiting;
    }
}

export const RESERVE_BATTERY_WH = 12 * 100;
export const SUPPLY_IDLE_WATTS = 25;
export const SUPPLY_VOLTAGE_MIN = 80;
export const METER_MAX_VOLTAGE = 300;
export const METER_MAX_CURRENT = 100;
export const METER_MAX_POWER = 25000;
export const METER_MAX_ENERGY = 1000000;
export const METER_MAX_ENERGY_STEP = 200;

export function isPlausibleMeterReading(reading) {
    const voltage = Number(reading?.voltage);
    const current = Number(reading?.current);
    const power = Number(reading?.power);
    const energy = Number(reading?.energy);
    if (!Number.isFinite(voltage) || voltage < 0 || voltage > METER_MAX_VOLTAGE) return false;
    if (!Number.isFinite(current) || current < 0 || current > METER_MAX_CURRENT) return false;
    if (!Number.isFinite(power) || power < 0 || power > METER_MAX_POWER) return false;
    if (!Number.isFinite(energy) || energy < 0 || energy > METER_MAX_ENERGY) return false;
    if (voltage >= SUPPLY_VOLTAGE_MIN && current >= 0.05 && power > voltage * current * 1.5 + 30) return false;
    return true;
}

export function filterMeterSeries(readings) {
    const kept = [];
    readings.forEach(reading => {
        if (!isPlausibleMeterReading(reading)) return;
        const energy = Number(reading.energy);
        const previous = kept.length ? Number(kept[kept.length - 1].energy) : null;
        if (previous !== null && energy - previous > METER_MAX_ENERGY_STEP) return;
        kept.push(reading);
    });
    return kept;
}

export function displayedPower(reading) {
    const voltage = Number(reading?.voltage);
    const power = Number(reading?.power);
    if (!Number.isFinite(voltage) || voltage < SUPPLY_VOLTAGE_MIN) return 0;
    return Number.isFinite(power) ? power : 0;
}

export function supplyEdgeTimes(readings, options = {}) {
    const historyExhausted = options.historyExhausted === true;
    const ordered = (readings || [])
        .filter(reading => Number.isFinite(Number(reading?.timestamp_unix)) && isPlausibleMeterReading(reading))
        .sort((a, b) => Number(b.timestamp_unix) - Number(a.timestamp_unix));
    if (!ordered.length) return { on: null, off: null, complete: historyExhausted };

    const isOn = (reading) => Number(reading.voltage) >= SUPPLY_VOLTAGE_MIN;
    const edgeDate = (reading) => new Date(Number(reading.timestamp_unix) * 1000);
    let index = 0;
    const currentOn = isOn(ordered[0]);
    while (index < ordered.length && isOn(ordered[index]) === currentOn) index += 1;
    const sawOpposite = index < ordered.length;
    const currentEdge = ordered[index - 1];
    let previousEdge = null;
    let previousBounded = false;
    if (sawOpposite) {
        const previousOn = !currentOn;
        let previous = index;
        while (previous < ordered.length && isOn(ordered[previous]) === previousOn) previous += 1;
        previousBounded = previous < ordered.length || historyExhausted;
        if (previousBounded) previousEdge = ordered[previous - 1];
    }

    const currentBounded = sawOpposite || historyExhausted;
    const onReading = currentOn ? (currentBounded ? currentEdge : null) : (previousBounded ? previousEdge : null);
    const offReading = currentOn ? (previousBounded ? previousEdge : null) : (currentBounded ? currentEdge : null);
    return {
        on: onReading ? edgeDate(onReading) : null,
        off: offReading ? edgeDate(offReading) : null,
        complete: currentBounded && (!sawOpposite || previousBounded)
    };
}

function mainsEventTime(event) {
    if (!event?.timestamp) return null;
    const time = event.timestamp.toDate ? event.timestamp.toDate() : new Date(event.timestamp);
    return time instanceof Date && !Number.isNaN(time.getTime()) ? time : null;
}

export function silenceOutageEdges(readings, events) {
    const ordered = (readings || [])
        .filter(reading => Number.isFinite(Number(reading?.timestamp_unix)) && isPlausibleMeterReading(reading))
        .sort((a, b) => Number(a.timestamp_unix) - Number(b.timestamp_unix));
    const mains = (events || []).map(event => {
        if (!event || !["RoutineCheck", "PowerLost", "PowerRestored", "SystemStart"].includes(event.device)) return null;
        const time = mainsEventTime(event);
        if (!time) return null;
        return { time, value: Number(event.value) };
    }).filter(Boolean);

    let found = null;
    for (let index = 1; index < ordered.length; index += 1) {
        const previousAt = Number(ordered[index - 1].timestamp_unix) * 1000;
        const nextAt = Number(ordered[index].timestamp_unix) * 1000;
        if (nextAt - previousAt < 180000) continue;
        if (Number(ordered[index - 1].voltage) < SUPPLY_VOLTAGE_MIN || Number(ordered[index].voltage) < SUPPLY_VOLTAGE_MIN) continue;
        const offs = mains
            .filter(event => event.value === 0 && event.time.getTime() > previousAt && event.time.getTime() < nextAt)
            .sort((a, b) => a.time - b.time);
        if (!offs.length) continue;
        found = { off: offs[0].time, on: new Date(nextAt) };
    }
    return found;
}

function formatEdgeTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--:--";
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    if (sameDay) return time;
    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")} ${time}`;
}

export function renderSupplyEdgeResult(edges) {
    const onEl = document.getElementById("time-last-on");
    const offEl = document.getElementById("time-last-off");
    if (onEl) onEl.innerText = formatEdgeTime(edges?.on);
    if (offEl) offEl.innerText = formatEdgeTime(edges?.off);
}

export function renderSupplyEdges(readings) {
    renderSupplyEdgeResult(supplyEdgeTimes(readings));
}

export function newestInverterOff(events) {
    const parsed = [];
    (events || []).forEach(event => {
        if (!event || !["RoutineCheck", "PowerLost", "PowerRestored", "SystemStart"].includes(event.device)) return;
        const time = event.timestamp?.toDate ? event.timestamp.toDate() : new Date(event.timestamp);
        if (!(time instanceof Date) || Number.isNaN(time.getTime())) return;
        parsed.push({ time, value: Number(event.value) });
    });
    parsed.sort((a, b) => b.time - a.time);
    if (!parsed.length || parsed[0].value !== 0) return null;
    let edge = parsed[0];
    for (const event of parsed) {
        if (event.value !== 0) break;
        edge = event;
    }
    return edge.time;
}

export function supplyReadingForDisplay(reading, events) {
    const offAt = newestInverterOff(events);
    if (!reading || !offAt) return reading;
    const meterAt = Number(reading.timestamp_unix) * 1000;
    if (Number.isFinite(meterAt) && offAt.getTime() <= meterAt) return reading;
    return { ...reading, voltage: 0, power: 0, current: 0 };
}

export function classifySupply(reading) {
    const voltage = Number(reading?.voltage);
    const power = Number(reading?.power);
    if (!Number.isFinite(voltage) || voltage < SUPPLY_VOLTAGE_MIN) return "blackout";
    if (Number.isFinite(power) && power > SUPPLY_IDLE_WATTS) return "reserve";
    return "grid";
}

export function renderSupplyStatus(reading, currentLang) {
    const t = translations[currentLang];
    const mode = classifySupply(reading);
    const voltage = Number(reading?.voltage);
    const power = displayedPower(reading);
    const voltageText = Number.isFinite(voltage) ? voltage.toFixed(0) : "--";
    const powerText = power.toFixed(0);
    const statusCard = document.getElementById("status-card");
    const statusText = document.getElementById("status-text");
    const statusSubtext = document.getElementById("status-subtext");
    const statusIconBg = document.getElementById("status-icon-bg");
    const statusPing = document.getElementById("status-ping");
    const modes = {
        grid: ["bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800", "text-green-700 dark:text-green-400", "bg-green-500 shadow-green-500/50", "fa-bolt", t.powerOn, t.subOn, false],
        reserve: ["bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800", "text-amber-700 dark:text-amber-400", "bg-amber-500 shadow-amber-500/50", "fa-car-battery", t.powerReserve, t.subReserve, true],
        blackout: ["bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800", "text-red-700 dark:text-red-400", "bg-red-500 shadow-red-500/50", "fa-plug-circle-xmark", t.powerOff, t.subOff, true]
    };
    const [cardClass, textClass, iconClass, icon, title, subtitle, hidePing] = modes[mode];
    statusCard.className = `${cardClass} rounded-2xl p-6 text-center transition-colors duration-500 flex flex-col`;
    statusText.className = `text-2xl font-bold ${textClass}`;
    statusText.innerText = title;
    statusSubtext.innerText = `${subtitle}\n${t.voltLabel}: ${voltageText} V\n${t.powerLabel}: ${powerText} W`;
    statusIconBg.className = `relative inline-flex rounded-full h-16 w-16 ${iconClass} items-center justify-center text-white text-2xl shadow-lg`;
    statusIconBg.innerHTML = `<i class="fas ${icon}"></i>`;
    statusPing.classList.toggle("hidden", hidePing);
}

function formatRuntime(hours) {
    const safe = Math.max(0, hours);
    let h = Math.floor(safe);
    let m = Math.round((safe - h) * 60);
    if (m === 60) {
        h += 1;
        m = 0;
    }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function renderReserveRuntime(reading, todayStartEnergy, currentLang, capacityKwh = 1.2, chargeReading = null) {
    const card = document.getElementById("reserve-runtime");
    const valueEl = document.getElementById("reserve-runtime-value");
    const noteEl = document.getElementById("reserve-runtime-note");
    const statusEl = document.getElementById("reserve-runtime-status");
    const barEl = document.getElementById("reserve-runtime-bar");
    if (!card || !valueEl || !noteEl || !statusEl || !barEl) return;

    const t = translations[currentLang] || translations.uk;
    const capacity = Number(capacityKwh);
    const usableKwh = Number.isFinite(capacity) && capacity > 0 ? capacity : 1.2;
    const stamp = chargeReading?.timestamp && typeof chargeReading.timestamp.toDate === "function"
        ? chargeReading.timestamp.toDate()
        : null;
    const chargeFresh = stamp && (Date.now() - stamp.getTime()) < CHARGE_FRESH_MS;
    const chargePower = Number(chargeReading?.power);
    const charging = chargeFresh && chargeReading.on && chargePower >= CHARGE_ACTIVE_WATTS;
    const onReserve = reading && classifySupply(reading) === "reserve";

    const paint = (tone, status, value, note, barPercent, barClass) => {
        const tones = {
            green: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
            amber: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
            gray: "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        };
        const statusTones = {
            green: "text-green-600 dark:text-green-300",
            amber: "text-amber-700 dark:text-amber-300",
            gray: "text-gray-400"
        };
        card.className = `rounded-2xl p-5 shadow-sm ${tones[tone]}`;
        statusEl.className = `text-xs font-bold uppercase tracking-wider ${statusTones[tone]}`;
        statusEl.textContent = status;
        valueEl.textContent = value;
        noteEl.textContent = note;
        barEl.style.width = `${Math.max(0, Math.min(100, barPercent))}%`;
        barEl.className = `${barClass} h-2.5 rounded-full transition-all duration-700`;
    };

    if (onReserve) {
        const power = Number(reading.power);
        const energy = Number(reading.energy);
        const start = Number(todayStartEnergy);
        const usedWh = Number.isFinite(energy) && Number.isFinite(start) ? Math.max(0, (energy - start) * 1000) : null;
        if (usedWh === null || !Number.isFinite(power) || power <= 0) {
            paint("amber", t.runtimeDischarge, "--%", t.runtimeWait, 0, "bg-amber-500");
            return;
        }
        const remainingWh = Math.max(0, usableKwh * 1000 - usedWh);
        const pct = Math.round((remainingWh / (usableKwh * 1000)) * 100);
        paint(
            "amber",
            t.runtimeDischarge,
            `${pct}%`,
            t.runtimeNote
                .replace("{today}", (usedWh / 1000).toFixed(3))
                .replace("{capacity}", usableKwh.toFixed(3))
                .replace("{power}", power.toFixed(0))
                .replace("{time}", formatRuntime(remainingWh / power)),
            pct,
            "bg-amber-500"
        );
        return;
    }

    if (!chargeFresh) {
        paint("gray", t.runtimeNoLink, "--", t.runtimeNoLinkNote, 0, "bg-gray-400");
        return;
    }

    if (charging) {
        paint(
            "green",
            t.runtimeCharge,
            `${chargePower.toFixed(0)} ${t.unitW}`,
            t.runtimeChargeNote
                .replace("{power}", chargePower.toFixed(0))
                .replace("{volt}", Number(chargeReading.voltage).toFixed(1))
                .replace("{amp}", Number(chargeReading.current).toFixed(2)),
            Math.min(100, Math.round(chargePower / 8)),
            "bg-green-500"
        );
        return;
    }

    paint(
        "gray",
        t.runtimeIdle,
        `${Number.isFinite(chargePower) ? chargePower.toFixed(0) : "0"} ${t.unitW}`,
        t.runtimeIdleNote,
        8,
        "bg-gray-400"
    );
}

export function renderHome(docs, currentLang) {
    const t = translations[currentLang];
    const latest = docs[0]; 
    const batLevel = latest.battery || 0;
    const eventType = latest.device || "Event";

    // Battery
    const batteryBar = document.getElementById("battery-bar");
    document.getElementById("battery-percent").innerText = batLevel + "%"; 
    batteryBar.style.width = batLevel + "%";
    if (batLevel > 50) batteryBar.className = "bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-out";
    else if (batLevel > 20) batteryBar.className = "bg-yellow-500 h-4 rounded-full transition-all duration-1000 ease-out";
    else batteryBar.className = "bg-red-500 h-4 rounded-full transition-all duration-1000 ease-out";

    // Update Times (ИСПРАВЛЕНО НА 24 ЧАСА)
    let timeString = "--:--";
    if (latest.timestamp && latest.timestamp.toDate) timeString = latest.timestamp.toDate().toLocaleTimeString([], { hour12: false });
    document.getElementById("last-update").innerText = `${t.updated}: ${timeString}`;
    document.getElementById("last-event-type").innerText = eventType;

    // History List
    let listHTML = "";
    docs.slice(0, 10).forEach((data) => {
        const evt = data.device || "Event";
        
        let timeStr = "--:--:--";
        let dateStr = "";
        if (data.timestamp && data.timestamp.toDate) {
            const dateObj = data.timestamp.toDate();
            timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            dateStr = String(dateObj.getDate()).padStart(2, '0') + '.' + String(dateObj.getMonth() + 1).padStart(2, '0');
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
            <div class="flex flex-col items-end flex-shrink-0">
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1 tracking-wider">${dateStr}</span>
                <span class="text-gray-500 dark:text-gray-400 text-xs font-mono bg-gray-200 dark:bg-gray-900 px-2 py-1 rounded whitespace-nowrap">
                    ${timeStr}
                </span>
            </div>
        </li>`;
    });
    document.getElementById("logs-list").innerHTML = listHTML;
}

export function updateMonitoringCards(latest, todayStartEnergy) {
    document.getElementById('mon-voltage').innerText = latest.voltage;
    document.getElementById('mon-power').innerText = displayedPower(latest);
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
            // ИСПРАВЛЕНО НА 24 ЧАСА
            timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            dateStr = String(dateObj.getDate()).padStart(2, '0') + '.' + String(dateObj.getMonth() + 1).padStart(2, '0');
        } else if (doc.created_at) {
            if (doc.created_at.includes(' ')) {
                const parts = doc.created_at.split(' ');
                timeStr = parts[1]; // "14:30:00"
                
                const dateParts = parts[0].split('-'); 
                if (dateParts.length === 3) {
                    dateStr = `${dateParts[2]}.${dateParts[1]}`; 
                } else {
                    dateStr = parts[0];
                }
            } else {
                timeStr = doc.created_at;
            }
        }

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

        const msg = doc.message || doc.event || doc.text || JSON.stringify(doc);
        const reason = doc.reason ? doc.reason.trim() : "";
        const subText = reason ? `<span class="font-semibold text-gray-500 dark:text-gray-400">${t.lblReason}</span> ${reason}` : "Системне повідомлення";

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