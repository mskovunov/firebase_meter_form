// js/charts.js

// Регистрируем плагин Chart.js
try {
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }
} catch (e) { console.error(e); }

let chartInstance = null;
let statsChartInstance = null;
let monChartInstance = null;
let monCurrentMode = 'power'; 
let monDataCache = [];

// === HELPERS ===
function formatDateDDMM(date) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${d}.${m}`;
}

// === MAIN CHARTS ===
export function updateMainChart(docs) {
    const reversedDocs = [...docs].reverse();
    const labels = reversedDocs.map(d => (d.timestamp && d.timestamp.toDate) ? d.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '');
    const dataPoints = reversedDocs.map(d => d.battery || 0);
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    
    const ctx = document.getElementById('energyChart').getContext('2d');

    if (chartInstance) {
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = dataPoints;
        chartInstance.options.scales.x.grid.color = gridColor;
        chartInstance.options.scales.y.grid.color = gridColor;
        chartInstance.options.scales.x.ticks.color = textColor;
        chartInstance.options.scales.y.ticks.color = textColor;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Battery %', data: dataPoints, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { display: false } }, scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor, maxTicksLimit: 6 } } } }
        });
    }
}

export function updateStatsChart(docs, translations, currentLang) {
    const stats = calculateDailyStats(docs);
    const labels = Object.keys(stats).sort((a, b) => {
        const [d1, m1] = a.split('.'); const [d2, m2] = b.split('.');
        if (m1 !== m2) return m1 - m2; return d1 - d2;
    });

    const dataOn = labels.map(day => stats[day].on.toFixed(2)); 
    const dataOff = labels.map(day => -stats[day].off.toFixed(2));
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const t = translations[currentLang];
    const ctx = document.getElementById('statsChart').getContext('2d');

    const formatTime = (value) => {
        const val = Math.abs(value);
        const h = Math.floor(val);
        const m = Math.round((val - h) * 60);
        if (h === 0) return `${m}${t.mShort}`; 
        if (m === 0) return `${h}${t.hShort}`; 
        return `${h}${t.hShort} ${m}${t.mShort}`; 
    };

    const datasets = [
        { label: t.statOn, data: dataOn, backgroundColor: '#10B981', borderRadius: 2 },
        { label: t.statOff, data: dataOff, backgroundColor: '#EF4444', borderRadius: 2 }
    ];

    if (statsChartInstance) {
        statsChartInstance.data.labels = labels;
        statsChartInstance.data.datasets = datasets;
        statsChartInstance.options.scales.y.grid.color = (context) => (context.tick.value === 0 ? 'rgba(239, 68, 68, 0.5)' : gridColor);
        statsChartInstance.options.scales.y.ticks.color = textColor; 
        statsChartInstance.options.scales.x.ticks.color = textColor;
        statsChartInstance.update();
    } else {
        statsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } },
                    datalabels: {
                        color: '#ffffff', font: { weight: 'bold', size: 10 },
                        formatter: (value) => { if (Math.abs(value) < 0.05) return null; return formatTime(value); },
                        anchor: 'center', align: 'center'
                    },
                    tooltip: {
                        callbacks: { label: (context) => { let label = context.dataset.label || ''; if (label) label += ': '; label += formatTime(context.raw); return label; } }
                    }
                },
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { color: textColor } },
                    y: {
                        stacked: true,
                        grid: { color: (context) => (context.tick.value === 0 ? 'rgba(239, 68, 68, 0.6)' : gridColor), lineWidth: (context) => (context.tick.value === 0 ? 2 : 1) },
                        ticks: { callback: (value) => Math.abs(value), color: textColor, stepSize: 1 } 
                    }
                }
            }
        });
    }
}

function calculateDailyStats(docs) {
    const sortedDocs = [...docs].sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
    const stats = {};
    if (sortedDocs.length === 0) return stats;

    let currentState = sortedDocs[0].value;
    let lastTime = sortedDocs[0].timestamp.toDate();
    const now = new Date();
    if (lastTime > now) lastTime = now;

    const addStats = (date, hours, state) => {
        const dayKey = formatDateDDMM(date);
        if (!stats[dayKey]) stats[dayKey] = { on: 0, off: 0 };
        if (state === 1) stats[dayKey].on += hours; else stats[dayKey].off += hours;
    };

    for (let i = 1; i < sortedDocs.length; i++) {
        let currentTime = sortedDocs[i].timestamp.toDate();
        if (currentTime > now) currentTime = now;
        if (currentTime < lastTime) continue;

        let tempTime = new Date(lastTime);
        const nextDayStart = new Date(tempTime); nextDayStart.setHours(24, 0, 0, 0);

        while (currentTime >= nextDayStart) {
            const hoursToEndOfDay = (nextDayStart - tempTime) / (1000 * 60 * 60);
            addStats(tempTime, hoursToEndOfDay, currentState);
            tempTime = new Date(nextDayStart); nextDayStart.setDate(nextDayStart.getDate() + 1);
        }
        const hoursDiff = (currentTime - tempTime) / (1000 * 60 * 60);
        addStats(tempTime, hoursDiff, currentState);
        lastTime = currentTime;
        if (sortedDocs[i].device === "PowerLost") currentState = 0; else if (sortedDocs[i].device === "PowerRestored") currentState = 1;
    }
    let tempTime = new Date(lastTime);
    const nextDayStart = new Date(tempTime); nextDayStart.setHours(24, 0, 0, 0);
    while (now >= nextDayStart) {
        const hoursToEndOfDay = (nextDayStart - tempTime) / (1000 * 60 * 60);
        addStats(tempTime, hoursToEndOfDay, currentState);
        tempTime = new Date(nextDayStart); nextDayStart.setDate(nextDayStart.getDate() + 1);
    }
    if (now > tempTime) {
        const hoursDiff = (now - tempTime) / (1000 * 60 * 60);
        addStats(tempTime, hoursDiff, currentState);
    }
    return stats;
}

// === MONITORING CHARTS ===
export function setMonChartMode(mode, docs, todayStartEnergy) {
    monCurrentMode = mode;
    monDataCache = docs;
    
    // 1. Сброс стилей для ВСЕХ карточек
    // Мы возвращаем их к базовому состоянию: белый фон (или темный), серый бордюр
    document.querySelectorAll('.monitor-card').forEach(el => {
        // Удаляем классы активного состояния
        el.classList.remove(
            'border-2', 
            'bg-blue-50', 'bg-orange-50', 'bg-purple-50', 'bg-green-50',
            'dark:bg-blue-900/20', 'dark:bg-orange-900/20', 'dark:bg-purple-900/20', 'dark:bg-green-900/20',
            'border-blue-500', 'border-orange-500', 'border-purple-500', 'border-green-500'
        );
        
        // Возвращаем базовые классы (если они были удалены)
        el.classList.add('bg-white', 'dark:bg-gray-800', 'border', 'border-gray-200', 'dark:border-gray-700');
    });
    
    // Определяем индекс активной карточки
    let activeId = -1;
    let activeColorClass = '';
    let activeBgClass = '';
    let activeDarkBgClass = '';

    if(mode === 'voltage') { 
        activeId = 0; 
        activeColorClass = 'border-orange-500'; 
        activeBgClass = 'bg-orange-50';
        activeDarkBgClass = 'dark:bg-orange-900/20';
    }
    else if(mode === 'power') { 
        activeId = 1; 
        activeColorClass = 'border-blue-500'; 
        activeBgClass = 'bg-blue-50';
        activeDarkBgClass = 'dark:bg-blue-900/20';
    }
    else if(mode === 'energy') { 
        activeId = 2; 
        activeColorClass = 'border-purple-500'; 
        activeBgClass = 'bg-purple-50';
        activeDarkBgClass = 'dark:bg-purple-900/20';
    }
    else if(mode === 'daily') { 
        activeId = 3; 
        activeColorClass = 'border-green-500'; 
        activeBgClass = 'bg-green-50';
        activeDarkBgClass = 'dark:bg-green-900/20';
    }
    
    // 2. Применяем активный стиль к ВЫБРАННОЙ карточке
    const cards = document.querySelectorAll('.monitor-card');
    if(cards[activeId]) {
       const card = cards[activeId];
       // Убираем базовые фоны и бордюры, чтобы не конфликтовали
       card.classList.remove('bg-white', 'dark:bg-gray-800', 'border-gray-200', 'dark:border-gray-700', 'border'); // убираем тонкий border
       
       // Добавляем активные: жирный цветной бордюр + легкий фон
       card.classList.add('border-2', activeColorClass, activeBgClass, activeDarkBgClass);
    }

    updateMonitoringChart(todayStartEnergy);
}

export function updateMonitoringChart(todayStartEnergy) {
    if (!monDataCache.length) return;

    const ctx = document.getElementById('monitoringChart').getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const labels = monDataCache.map(d => d.created_at ? d.created_at.split(' ')[1].substring(0,5) : '');
    let data = [];
    let label = '';
    let color = '';

    if (monCurrentMode === 'voltage') {
        data = monDataCache.map(d => d.voltage);
        label = 'Напруга (V)'; color = '#F59E0B';
    } else if (monCurrentMode === 'power') {
        data = monDataCache.map(d => d.power);
        label = 'Потужність (W)'; color = '#3B82F6';
    } else if (monCurrentMode === 'energy') {
        data = monDataCache.map(d => d.energy);
        label = 'Лічильник (kWh)'; color = '#8B5CF6';
    } else if (monCurrentMode === 'daily') {
        data = monDataCache.map(d => {
            if(todayStartEnergy) return Math.max(0, (d.energy - todayStartEnergy)).toFixed(3);
            return 0;
        });
        label = 'За сьогодні (kWh)'; color = '#10B981';
    }
    
    const titleEl = document.getElementById('mon-chart-title');
    if(titleEl) titleEl.innerText = label;

    if (monChartInstance) {
        monChartInstance.data.labels = labels;
        monChartInstance.data.datasets[0].data = data;
        monChartInstance.data.datasets[0].label = label;
        monChartInstance.data.datasets[0].borderColor = color;
        monChartInstance.data.datasets[0].backgroundColor = color + '33';
        monChartInstance.options.scales.x.ticks.color = textColor;
        monChartInstance.options.scales.y.ticks.color = textColor;
        monChartInstance.options.scales.x.grid.color = gridColor;
        monChartInstance.options.scales.y.grid.color = gridColor;
        monChartInstance.update();
    } else {
        monChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: label, data: data, borderColor: color, backgroundColor: color + '33', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, datalabels: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: textColor, maxTicksLimit: 6 } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor } }
                }
            }
        });
    }
}