// js/charts.js

try {
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }
} catch (e) { console.error(e); }

let chartInstance = null;
let statsChartInstance = null;
let monChartInstance = null;

let monCurrentMode = 'power';
let energyRange = 'day';
let monDataCache = [];
let currentTrans = {}; // Храним переводы здесь

// === CONFIGURATION ===
// Функция для обновления языка внутри модуля графиков
export function updateChartConfig(translations) {
    currentTrans = translations;
    // Если график уже есть - перерисуем его с новым языком
    if(monDataCache.length > 0) updateMonitoringChart();
}

// === HELPERS ===
function formatDateDDMM(date) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${d}.${m}`;
}

// === 1. MAIN CHART (BATTERY) ===
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

// === 2. STATS CHART ===
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

// === 3. MONITORING CHARTS ===

export function changeEnergyRange(range) {
    energyRange = range;
    ['day', 'week', 'month'].forEach(r => {
        const btn = document.getElementById(`btn-range-${r}`);
        if(btn) {
            if(r === range) {
                btn.classList.add('bg-white', 'dark:bg-gray-600', 'shadow-sm', 'text-gray-800', 'dark:text-white');
                btn.classList.remove('text-gray-500', 'dark:text-gray-400');
            } else {
                btn.classList.remove('bg-white', 'dark:bg-gray-600', 'shadow-sm', 'text-gray-800', 'dark:text-white');
                btn.classList.add('text-gray-500', 'dark:text-gray-400');
            }
        }
    });
    updateMonitoringChart();
}

export function setMonChartMode(mode, docs, todayStartEnergy) {
    monCurrentMode = mode;
    monDataCache = docs;
    
    document.querySelectorAll('.monitor-card').forEach(el => {
        el.classList.remove('border-2', 'bg-blue-50', 'bg-orange-50', 'bg-purple-50', 'bg-green-50', 'dark:bg-blue-900/20', 'dark:bg-orange-900/20', 'dark:bg-purple-900/20', 'dark:bg-green-900/20', 'border-blue-500', 'border-orange-500', 'border-purple-500', 'border-green-500');
        el.classList.add('bg-white', 'dark:bg-gray-800', 'border', 'border-gray-200', 'dark:border-gray-700');
    });
    
    let activeId = -1;
    let colorClass = ''; let bgClass = ''; let darkBgClass = '';

    if(mode === 'voltage') { activeId = 0; colorClass = 'border-orange-500'; bgClass = 'bg-orange-50'; darkBgClass = 'dark:bg-orange-900/20'; }
    else if(mode === 'power') { activeId = 1; colorClass = 'border-blue-500'; bgClass = 'bg-blue-50'; darkBgClass = 'dark:bg-blue-900/20'; }
    else if(mode === 'energy') { activeId = 2; colorClass = 'border-purple-500'; bgClass = 'bg-purple-50'; darkBgClass = 'dark:bg-purple-900/20'; }
    else if(mode === 'daily') { activeId = 3; colorClass = 'border-green-500'; bgClass = 'bg-green-50'; darkBgClass = 'dark:bg-green-900/20'; }
    
    const cards = document.querySelectorAll('.monitor-card');
    if(cards[activeId]) {
       const card = cards[activeId];
       card.classList.remove('bg-white', 'dark:bg-gray-800', 'border-gray-200', 'dark:border-gray-700', 'border');
       card.classList.add('border-2', colorClass, bgClass, darkBgClass);
    }

    const selector = document.getElementById('energy-range-selector');
    if (selector) {
        if (mode === 'energy') {
            selector.classList.remove('hidden');
            changeEnergyRange(energyRange); 
        } else {
            selector.classList.add('hidden');
            updateMonitoringChart(todayStartEnergy);
        }
    }
}

export function updateMonitoringChart(todayStartEnergy) {
    if (!monDataCache || !monDataCache.length) return;

    const ctx = document.getElementById('monitoringChart').getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    let chartType = 'line';
    let labels = [];
    let data = [];
    let label = '';
    let color = '';
    let bgColor = '';
    
    // Используем переводы (или дефолтный текст, если еще не загрузились)
    const t = currentTrans;

    if (monCurrentMode === 'energy') {
        chartType = 'bar';
        const processed = processBarData(monDataCache, energyRange);
        labels = processed.labels;
        data = processed.data;
        
        if(energyRange === 'day') label = t.cEnergyDay || 'Споживання по днях (kWh)';
        else if(energyRange === 'week') label = t.cEnergyWeek || 'Споживання по тижнях (kWh)';
        else label = t.cEnergyMonth || 'Споживання по місяцях (kWh)';
        
        color = '#8B5CF6'; bgColor = 'rgba(139, 92, 246, 0.6)';
    } else {
        const chartData = [...monDataCache];
        labels = chartData.map(d => d.created_at ? d.created_at.split(' ')[1].substring(0,5) : '');
        
        if (monCurrentMode === 'voltage') {
            data = chartData.map(d => d.voltage);
            label = t.cVoltage || 'Напруга (V)'; 
            color = '#F59E0B'; bgColor = 'rgba(245, 158, 11, 0.2)';
        } else if (monCurrentMode === 'power') {
            data = chartData.map(d => d.power);
            label = t.cPower || 'Потужність (W)'; 
            color = '#3B82F6'; bgColor = 'rgba(59, 130, 246, 0.2)';
        } else if (monCurrentMode === 'daily') {
            data = chartData.map(d => {
                if(todayStartEnergy) return Math.max(0, (d.energy - todayStartEnergy)).toFixed(3);
                return 0;
            });
            label = t.cDaily || 'За сьогодні (kWh)'; 
            color = '#10B981'; bgColor = 'rgba(16, 185, 129, 0.2)';
        }
    }
    
    const titleEl = document.getElementById('mon-chart-title');
    if(titleEl) titleEl.innerText = label;

    if (monChartInstance) {
        monChartInstance.destroy();
    }

    monChartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: bgColor,
                borderWidth: chartType === 'bar' ? 0 : 2,
                borderRadius: chartType === 'bar' ? 4 : 0,
                fill: chartType === 'line',
                tension: 0.4,
                pointRadius: chartType === 'line' ? 0 : 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }, 
                datalabels: { 
                    display: chartType === 'bar',
                    color: textColor,
                    anchor: 'end',
                    align: 'top',
                    offset: -4,
                    font: { size: 10 }
                } 
            },
            scales: {
                x: { 
                    grid: { display: false }, 
                    ticks: { 
                        color: textColor,
                        maxRotation: 0,
                        autoSkip: false,
                        callback: function(val, index, values) {
                            if (chartType === 'bar') {
                                const total = values.length;
                                if (total <= 12) return this.getLabelForValue(val);
                                if (index % 2 === 0) return this.getLabelForValue(val);
                                return null;
                            }
                            const total = values.length;
                            if (total <= 6) return this.getLabelForValue(val);
                            if (index === total - 1) return this.getLabelForValue(val);
                            const targetCount = 6; 
                            const step = Math.ceil(total / targetCount);
                            if (index % step === 0 && index < total - step * 0.6) {
                                return this.getLabelForValue(val);
                            }
                            return null;
                        }
                    } 
                },
                y: { 
                    beginAtZero: chartType === 'bar',
                    grid: { color: gridColor }, 
                    ticks: { color: textColor } 
                }
            }
        }
    });
}

function processBarData(docs, rangeType) {
    if (!docs || docs.length < 2) return { labels: [], data: [] };

    const grouped = {};
    const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    };
    const getMonthNameUA = (idx) => ["Січ/Jan", "Лют/Feb", "Бер/Mar", "Кві/Apr", "Тра/May", "Чер/Jun", "Лип/Jul", "Сер/Aug", "Вер/Sep", "Жов/Oct", "Лис/Nov", "Гру/Dec"][idx];

    docs.forEach(doc => {
        let dateObj = new Date(doc.created_at); 
        if (isNaN(dateObj)) return;

        let key = ""; let label = ""; let sortKey = 0;

if (rangeType === 'day') {
             // ВИПРАВЛЕННЯ: Формуємо ключ вручну з локального часу, а не через ISO (UTC)
             const year = dateObj.getFullYear();
             const month = String(dateObj.getMonth() + 1).padStart(2, "0");
             const day = String(dateObj.getDate()).padStart(2, "0");
             
             key = `${year}-${month}-${day}`; 
             
             // Підпис залишається як був
             label = `${day}.${month}`;
             sortKey = dateObj.getTime();
        } else if (rangeType === 'week') {
             const weekNum = getWeekNumber(dateObj);
             const year = dateObj.getFullYear();
             key = `${year}-W${weekNum}`;
             label = `W${weekNum}`;
             sortKey = year * 100 + weekNum;
        } else if (rangeType === 'month') {
             const month = dateObj.getMonth();
             const year = dateObj.getFullYear();
             key = `${year}-${month}`;
             label = getMonthNameUA(month);
             sortKey = year * 100 + month;
        }

        if (!grouped[key]) {
            grouped[key] = { min: Infinity, max: -Infinity, label: label, sort: sortKey };
        }
        const val = doc.energy;
        if (val < grouped[key].min) grouped[key].min = val;
        if (val > grouped[key].max) grouped[key].max = val;
    });

    let sortedKeys = Object.keys(grouped).sort((a, b) => grouped[a].sort - grouped[b].sort);
    if (rangeType === 'day') sortedKeys = sortedKeys.slice(-7);
    if (rangeType === 'week') sortedKeys = sortedKeys.slice(-8);
    if (rangeType === 'month') sortedKeys = sortedKeys.slice(-12);

    const resultLabels = []; const resultData = [];
    sortedKeys.forEach(key => {
        const item = grouped[key];
        let consumption = item.max - item.min;
        if (consumption < 0) consumption = 0;
        if (consumption > 1000) consumption = 0; 
        resultLabels.push(item.label);
        resultData.push(consumption.toFixed(2));
    });
    return { labels: resultLabels, data: resultData };
}