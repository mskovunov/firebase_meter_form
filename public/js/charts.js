// js/charts.js
import { classifySupply, filterMeterSeries } from './ui.js?v=9';

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
let energyDataCache = [];
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
function downsampleBattery(docs) {
    const buckets = new Map();
    docs.forEach(item => {
        if (!item.timestamp?.toDate) return;
        const date = item.timestamp.toDate();
        const bucket = new Date(date);
        bucket.setMinutes(Math.floor(date.getMinutes() / 30) * 30, 0, 0);
        buckets.set(bucket.getTime(), item.battery || 0);
    });
    return [...buckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([time, battery]) => {
            const date = new Date(time);
            const pad = value => String(value).padStart(2, '0');
            return {
                label: `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
                battery
            };
        });
}

function batteryRange(values) {
    if (!values.length) return { min: 0, max: 100 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max(5, (max - min) * 0.25);
    let axisMin = Math.max(0, Math.floor(min - pad));
    let axisMax = Math.min(100, Math.ceil(max + pad));
    if (axisMax - axisMin < 5) axisMin = Math.max(0, axisMax - 5);
    return { min: axisMin, max: axisMax };
}

function dayTick(value) {
    const label = this.getLabelForValue(value);
    const day = label.slice(0, 5);
    if (value === 0) return day;
    const previous = this.getLabelForValue(value - 1);
    return previous.slice(0, 5) === day ? null : day;
}

export function updateMainChart(docs) {
    const sampled = downsampleBattery(docs);
    const labels = sampled.map(item => item.label);
    const dataPoints = sampled.map(item => item.battery);
    const range = batteryRange(dataPoints);
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
        chartInstance.options.scales.x.ticks.callback = dayTick;
        chartInstance.options.scales.x.ticks.autoSkip = false;
        chartInstance.options.scales.x.ticks.maxRotation = 0;
        chartInstance.options.scales.y.ticks.color = textColor;
        chartInstance.options.scales.y.min = range.min;
        chartInstance.options.scales.y.max = range.max;
        chartInstance.update();
        chartInstance.resize();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Battery %', data: dataPoints, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { display: false } }, scales: { y: { min: range.min, max: range.max, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { display: false }, ticks: { color: textColor, autoSkip: false, maxRotation: 0, callback: dayTick } } } }
        });
    }
}

// === 2. STATS CHART ===
export function updateStatsChart(docs, translations, currentLang) {
    const stats = calculateSupplyStats(docs);
    const labels = Object.keys(stats).sort((a, b) => stats[a].sort - stats[b].sort);

    const dataOn = labels.map(day => stats[day].grid.toFixed(2));
    const dataReserve = labels.map(day => stats[day].reserve.toFixed(2));
    const dataOff = labels.map(day => -stats[day].off.toFixed(2));
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const t = translations[currentLang];
    const ctx = document.getElementById('statsChart').getContext('2d');

    const formatTime = (value) => {
        const val = Math.abs(Number(value) || 0);
        let h = Math.floor(val);
        let m = Math.round((val - h) * 60);
        if (m === 60) {
            h += 1;
            m = 0;
        }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const datasets = [
        { label: t.statReserve, data: dataReserve, backgroundColor: '#F59E0B', borderRadius: 2, datalabels: { color: '#1f2937' } },
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
        statsChartInstance.resize();
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

function calculateSupplyStats(docs) {
    const readings = filterMeterSeries(
        [...docs]
            .filter(item => Number.isFinite(Number(item.timestamp_unix)))
            .sort((a, b) => Number(a.timestamp_unix) - Number(b.timestamp_unix))
    );
    const stats = {};
    if (readings.length === 0) return stats;

    let currentState = classifySupply(readings[0]);
    let lastTime = new Date(Number(readings[0].timestamp_unix) * 1000);
    const now = new Date();
    if (lastTime > now) lastTime = now;

    const addStats = (date, hours, state) => {
        if (hours <= 0) return;
        const dayKey = formatDateDDMM(date);
        if (!stats[dayKey]) {
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            stats[dayKey] = { grid: 0, reserve: 0, off: 0, sort: dayStart.getTime() };
        }
        if (state === 'grid') stats[dayKey].grid += hours;
        else if (state === 'reserve') stats[dayKey].reserve += hours;
        else stats[dayKey].off += hours;
    };

    const advance = (from, to, state) => {
        let tempTime = new Date(from);
        const nextDayStart = new Date(tempTime);
        nextDayStart.setHours(24, 0, 0, 0);
        while (to >= nextDayStart) {
            addStats(tempTime, (nextDayStart - tempTime) / (1000 * 60 * 60), state);
            tempTime = new Date(nextDayStart);
            nextDayStart.setDate(nextDayStart.getDate() + 1);
        }
        addStats(tempTime, (to - tempTime) / (1000 * 60 * 60), state);
    };

    for (let i = 1; i < readings.length; i++) {
        let currentTime = new Date(Number(readings[i].timestamp_unix) * 1000);
        if (currentTime > now) currentTime = now;
        if (currentTime < lastTime) continue;
        advance(lastTime, currentTime, currentState);
        lastTime = currentTime;
        currentState = classifySupply(readings[i]);
    }
    if (now > lastTime) advance(lastTime, now, currentState);
    return stats;
}

// === 3. MONITORING CHARTS ===

export function changeEnergyRange(range) {
    energyRange = range;
    energyDataCache = [];
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
}

export function setEnergyData(range, points) {
    if (range !== energyRange) return;
    energyDataCache = Array.isArray(points) ? points : [];
    if (monCurrentMode === 'energy') updateMonitoringChart();
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
    if (monCurrentMode === 'energy') {
        if (!energyDataCache.length) return;
    } else if (!monDataCache || !monDataCache.length) {
        return;
    }

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
        labels = energyDataCache.map(point => point.label);
        data = energyDataCache.map(point => point.value);
        
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
                if (todayStartEnergy != null) return Math.max(0, (d.energy - todayStartEnergy)).toFixed(3);
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
            layout: {
                padding: { bottom: chartType === 'bar' && energyRange === 'month' ? 8 : 0 }
            },
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
                        minRotation: chartType === 'bar' && energyRange === 'month' ? 90 : 0,
                        maxRotation: chartType === 'bar' && energyRange === 'month' ? 90 : 0,
                        autoSkip: false,
                        callback: function(val, index, values) {
                            if (chartType === 'bar') {
                                const total = values.length;
                                if (energyRange === 'month' || total <= 8) return this.getLabelForValue(val);
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