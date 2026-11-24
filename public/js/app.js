// js/app.js
import { db } from './config.js';
import * as UI from './ui.js?v=2.2411.2138';
import * as Charts from './charts.js?v=2.2411.2138';
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
let supplyEdgeHistory = [];
let confirmedSilence = null;
let supplyEdgesUnsubscribe = null;
let supplyEdgeRequest = 0;
let cachedSupplyEdges = null;
let supplyHistoryReady = false;
let inverterOffAt = null;
let mainUnsubscribe = null;
let batteryCapacityKwh = 1.2;
let latestChargeReading = null;
let chargeUnsubscribe = null;
let chargeHistory = [];
let socMeterDocs = [];
let chargeBalanceStarted = false;
let latestReserveEstimate = null;

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
    paintBoardLink();
    // ОТПРАВЛЯЕМ ПЕРЕВОДЫ В ГРАФИКИ
    Charts.updateChartConfig(UI.translations[currentLang]);
    startMainListener();
    startSupplyEdgesListener();
    startChargeListener();
    paintCachedBalance();
    setInterval(() => {
        paintBoardLink();
        if (!latestChargeReading) return;
        UI.renderCharge(latestChargeReading, currentLang);
        if (latestSupplyReading) paintLiveSupply();
    }, 20000);
    window.addEventListener("online", paintBoardLink);
    window.addEventListener("offline", paintBoardLink);
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
    window.savePlugSettings = () => {
        savePlugSettingsToDB();
    };
});

// === LOGIC ===

function handleViewChange(viewName) {
    UI.showView(viewName);
    
    if (viewName === 'monitoring') {
        startMonitoringListener();
        fetchTodayStart();
    }

    if (viewName === 'charge') {
        startChargeListener();
        startChargeBalance();
    }

    // 3. ЯКЩО ВІДКРИЛИ НАЛАШТУВАННЯ - ВАНТАЖИМО ДАНІ
    if (viewName === 'settings') { 
        loadSettingsFromDB();
    }

    if (viewName === 'graphs') {
        startChargeBalance();
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

function rememberInverterOff(reading) {
    const offAt = UI.newestInverterOff(currentDocs);
    if (!offAt) return;
    const meterAt = Number(reading?.timestamp_unix) * 1000;
    if (Number.isFinite(meterAt) && meterAt >= offAt.getTime()) return;
    inverterOffAt = offAt;
}

function readingsForSilence() {
    const byTime = new Map();
    [...supplyEdgeHistory, ...supplyEdgeReadings].forEach(reading => {
        const time = Number(reading?.timestamp_unix);
        if (Number.isFinite(time)) byTime.set(time, reading);
    });
    return [...byTime.values()];
}

function noteSilence(events) {
    const silence = UI.silenceOutageEdges(readingsForSilence(), events || currentDocs);
    if (silence && (!confirmedSilence || silence.on > confirmedSilence.on)) confirmedSilence = silence;
    return silence;
}

function edgesForDisplay() {
    const edges = { ...(cachedSupplyEdges || { on: null, off: null }) };
    noteSilence(currentDocs);
    if (confirmedSilence?.on && (!edges.on || confirmedSilence.on > edges.on)) edges.on = confirmedSilence.on;
    if (confirmedSilence?.off && (!edges.off || confirmedSilence.off > edges.off)) edges.off = confirmedSilence.off;
    const meterAt = Number(latestSupplyReading?.timestamp_unix) * 1000;
    if (inverterOffAt && (!Number.isFinite(meterAt) || meterAt < inverterOffAt.getTime()) && (!edges.off || inverterOffAt > edges.off)) {
        edges.off = inverterOffAt;
    }
    return edges;
}

function paintLiveSupply() {
    paintBoardLink();
    if (!latestSupplyReading) return;
    rememberInverterOff(latestSupplyReading);
    const shown = UI.supplyReadingForDisplay(latestSupplyReading, currentDocs);
    UI.renderSupplyStatus(shown, currentLang, latestChargeReading);
    paintReserveCard();
    if (supplyHistoryReady && (cachedSupplyEdges || inverterOffAt || confirmedSilence)) {
        UI.renderSupplyEdgeResult(edgesForDisplay());
    }
}

let silenceLookup = 0;

async function lookupSilenceGap() {
    const requestId = ++silenceLookup;
    const readings = readingsForSilence()
        .filter(UI.isPlausibleMeterReading)
        .sort((a, b) => Number(a.timestamp_unix) - Number(b.timestamp_unix));
    let checked = 0;
    for (let index = readings.length - 1; index > 0; index -= 1) {
        const previousAt = Number(readings[index - 1].timestamp_unix) * 1000;
        const nextAt = Number(readings[index].timestamp_unix) * 1000;
        if (nextAt - previousAt < 180000) continue;
        if (Number(readings[index - 1].voltage) < 80 || Number(readings[index].voltage) < 80) continue;
        checked += 1;
        if (confirmedSilence && confirmedSilence.on >= new Date(nextAt)) return;
        const known = UI.silenceOutageEdges([readings[index - 1], readings[index]], currentDocs);
        if (known) {
            confirmedSilence = known;
            UI.renderSupplyEdgeResult(edgesForDisplay());
            return;
        }
        const snap = await getDocs(query(
            collection(db, "esp32_data"),
            where("timestamp", ">=", new Date(previousAt)),
            where("timestamp", "<=", new Date(nextAt)),
            orderBy("timestamp", "asc"),
            limit(40)
        ));
        if (requestId !== silenceLookup) return;
        const found = UI.silenceOutageEdges([readings[index - 1], readings[index]], snap.docs.map(item => item.data()));
        if (found) {
            if (!confirmedSilence || found.on > confirmedSilence.on) confirmedSilence = found;
            UI.renderSupplyEdgeResult(edgesForDisplay());
            return;
        }
        if (checked >= 60 || previousAt < Date.now() - 36 * 60 * 60 * 1000) return;
    }
}

function applyLatestSupply(readings) {
    const reading = readings.find(UI.isPlausibleMeterReading);
    if (!reading) return;
    latestSupplyReading = reading;
    paintLiveSupply();
}

async function extendSupplyEdges(docs, stateOn) {
    const requestId = ++supplyEdgeRequest;
    let combined = docs.map(item => item.data());
    let cursor = docs[docs.length - 1] || null;
    let exhausted = docs.length < SUPPLY_EDGE_LIMIT;
    const oldestAllowed = Math.floor(Date.now() / 1000) - 8 * 24 * 3600;
    let edges = UI.supplyEdgeTimes(combined, { historyExhausted: exhausted });

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
    }

    if (requestId !== supplyEdgeRequest) return;
    supplyEdgeHistory = combined;
    cachedSupplyEdges = { ...edges, stateOn };
    await lookupSilenceGap();
    if (requestId !== supplyEdgeRequest) return;
    supplyHistoryReady = true;
    const shown = edgesForDisplay();
    cachedSupplyEdges = { ...cachedSupplyEdges, on: shown.on, off: shown.off, complete: true };
    const newestUnix = combined.reduce((max, reading) => Math.max(max, Number(reading.timestamp_unix) || 0), 0);
    supplyCursorUnix = newestUnix;
    gapCheckedUnix = newestUnix;
    supplyStateOn = stateOn;
    supplyEdgeHistory = [];
    UI.renderSupplyEdgeResult(shown);
    paintLiveSupply();
    await saveSupplyState();
    supplyStateReady = true;
}

function startSupplyEdgesListener() {
    if (supplyEdgesUnsubscribe) return;
    const qEdges = query(collection(db, "meter_readings"), orderBy("timestamp_unix", "desc"), limit(5));
    supplyEdgesUnsubscribe = onSnapshot(qEdges, (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        supplyEdgeReadings = snapshot.docs.map(item => item.data());
        applyLatestSupply(supplyEdgeReadings);
        if (supplyStateReady) enqueueSupplyTail(supplyEdgeReadings);
        else ensureSupplyState();
    }, (err) => console.error("Supply edges listener error:", err));
}

let supplyStateReady = false;
let supplyEnsureStarted = false;
let supplyCursorUnix = 0;
let supplyStateOn = null;
let supplyModeName = null;
let supplySaveTimer = 0;
let gapCheckedUnix = 0;
let supplyTailQueue = Promise.resolve();
const LIGHT_EDGE_RULE = 2;

function restoreSupplyState(data) {
    supplyCursorUnix = Number(data.cursorUnix) || 0;
    supplyStateOn = typeof data.stateOn === "boolean" ? data.stateOn : null;
    supplyModeName = data.mode === "grid" || data.mode === "reserve" || data.mode === "blackout" ? data.mode : null;
    gapCheckedUnix = Number(data.gapCheckedUnix) || 0;
    cachedSupplyEdges = {
        on: Number.isFinite(data.onMs) ? new Date(data.onMs) : null,
        off: Number.isFinite(data.offMs) ? new Date(data.offMs) : null,
        complete: true,
        stateOn: supplyStateOn
    };
    supplyHistoryReady = true;
    UI.renderSupplyEdgeResult(edgesForDisplay());
}

async function saveSupplyState() {
    const edges = cachedSupplyEdges || {};
    await setDoc(doc(db, "esp32_settings", "supply_state"), {
        onMs: edges.on instanceof Date ? edges.on.getTime() : null,
        offMs: edges.off instanceof Date ? edges.off.getTime() : null,
        cursorUnix: supplyCursorUnix || null,
        gapCheckedUnix: gapCheckedUnix || null,
        stateOn: supplyStateOn,
        mode: supplyModeName,
        edgeRule: LIGHT_EDGE_RULE,
        complete: true,
        building: false,
        updated_at: new Date()
    }, { merge: true });
}

function scheduleSupplySave() {
    clearTimeout(supplySaveTimer);
    supplySaveTimer = setTimeout(() => {
        saveSupplyState().catch(err => console.error("Supply state save error:", err));
    }, 5000);
}

function gapPair(previousUnix, nextUnix) {
    return [
        { timestamp_unix: previousUnix, voltage: 220, current: 0, power: 0, energy: 1 },
        { timestamp_unix: nextUnix, voltage: 220, current: 0, power: 0, energy: 1 }
    ];
}

function memoryCoversGap(previousAt) {
    const times = (currentDocs || []).map(event => {
        const time = event?.timestamp?.toDate ? event.timestamp.toDate() : new Date(event?.timestamp);
        return time instanceof Date && !Number.isNaN(time.getTime()) ? time.getTime() : null;
    }).filter(time => time != null);
    return times.length > 0 && Math.min(...times) <= previousAt;
}

function adoptSilence(known) {
    if (!known) return false;
    if (!cachedSupplyEdges) cachedSupplyEdges = { on: null, off: null, complete: true };
    let changed = false;
    if (known.off && (!cachedSupplyEdges.off || known.off > cachedSupplyEdges.off)) {
        cachedSupplyEdges.off = known.off;
        changed = true;
    }
    if (known.on && (!cachedSupplyEdges.on || known.on > cachedSupplyEdges.on)) {
        cachedSupplyEdges.on = known.on;
        changed = true;
    }
    return changed;
}

async function outageInsideGap(previousUnix, nextUnix) {
    const previousAt = previousUnix * 1000;
    const nextAt = nextUnix * 1000;
    if (!(nextAt - previousAt >= 180000)) return null;
    const pair = gapPair(previousUnix, nextUnix);
    if (memoryCoversGap(previousAt)) return UI.silenceOutageEdges(pair, currentDocs);

    let cursor = null;
    let events = [];
    for (let page = 0; page < 4; page += 1) {
        const snap = await getDocs(query(
            collection(db, "esp32_data"),
            where("timestamp", ">=", new Date(previousAt)),
            where("timestamp", "<=", new Date(nextAt)),
            orderBy("timestamp", "asc"),
            ...(cursor ? [startAfter(cursor)] : []),
            limit(80)
        ));
        events = events.concat(snap.docs.map(item => item.data()));
        const found = UI.silenceOutageEdges(pair, events);
        if (found || snap.size < 80) return found;
        cursor = snap.docs[snap.docs.length - 1];
    }
    return UI.silenceOutageEdges(pair, events);
}

function enqueueSupplyTail(readings) {
    const job = supplyTailQueue.then(() => applySupplyTail(readings));
    supplyTailQueue = job.catch(err => console.error("Supply tail error:", err));
    return job;
}

async function applyLightSample(previousMode, previousUnix, reading) {
    const unix = Number(reading.timestamp_unix);
    const nextMode = UI.classifySupply(reading);
    if (!cachedSupplyEdges) cachedSupplyEdges = { on: null, off: null, complete: true };
    const gap = previousUnix && unix - previousUnix >= 180;
    if (previousMode === "grid" && gap) {
        const known = await outageInsideGap(previousUnix, unix);
        if (known) {
            cachedSupplyEdges.off = known.off;
            if (nextMode === "grid") cachedSupplyEdges.on = known.on;
            return nextMode;
        }
    }
    if (previousMode && nextMode !== previousMode) {
        if (nextMode === "grid") cachedSupplyEdges.on = new Date(unix * 1000);
        else if (previousMode === "grid") cachedSupplyEdges.off = new Date(unix * 1000);
    }
    return nextMode;
}

async function applySupplyTail(readings) {
    const ordered = (readings || [])
        .filter(UI.isPlausibleMeterReading)
        .sort((a, b) => Number(a.timestamp_unix) - Number(b.timestamp_unix));
    let changed = false;
    let previousUnix = supplyCursorUnix;
    let previousMode = supplyModeName;
    for (const reading of ordered) {
        const unix = Number(reading.timestamp_unix);
        if (!Number.isFinite(unix) || unix <= supplyCursorUnix) continue;
        previousMode = await applyLightSample(previousMode, previousUnix, reading);
        previousUnix = unix;
        supplyStateOn = Number(reading.voltage) >= 80;
        supplyCursorUnix = unix;
        gapCheckedUnix = unix;
        changed = true;
    }
    if (!changed) return;
    supplyModeName = previousMode;
    if (cachedSupplyEdges) cachedSupplyEdges.stateOn = supplyStateOn;
    supplyHistoryReady = true;
    UI.renderSupplyEdgeResult(edgesForDisplay());
    scheduleSupplySave();
}

async function rebuildLightEdges() {
    const start = Math.max(0, supplyCursorUnix - 36 * 3600);
    cachedSupplyEdges = { on: null, off: null, complete: true, stateOn: supplyStateOn };
    let cursor = start;
    let previousUnix = null;
    let mode = null;
    let firstPage = true;
    while (cursor < supplyCursorUnix) {
        const snap = await getDocs(query(
            collection(db, "meter_readings"),
            where("timestamp_unix", firstPage ? ">=" : ">", cursor),
            orderBy("timestamp_unix", "asc"),
            limit(200)
        ));
        firstPage = false;
        if (snap.empty) break;
        const rows = snap.docs.map(item => item.data()).filter(UI.isPlausibleMeterReading);
        for (const reading of rows) {
            const unix = Number(reading.timestamp_unix);
            if (unix > supplyCursorUnix) break;
            mode = await applyLightSample(mode, previousUnix, reading);
            previousUnix = unix;
        }
        const last = Number(snap.docs[snap.docs.length - 1].data().timestamp_unix);
        if (!Number.isFinite(last) || last <= cursor) break;
        cursor = last;
        if (cursor >= supplyCursorUnix || snap.size < 200) break;
    }
    supplyModeName = mode;
    supplyStateOn = mode === "grid" || mode === "reserve";
    gapCheckedUnix = supplyCursorUnix;
    if (cachedSupplyEdges) cachedSupplyEdges.stateOn = supplyStateOn;
    supplyHistoryReady = true;
    UI.renderSupplyEdgeResult(edgesForDisplay());
    await saveSupplyState();
}

async function repairUncheckedGaps() {
    const edgeSeconds = [cachedSupplyEdges?.on, cachedSupplyEdges?.off]
        .filter(date => date instanceof Date)
        .map(date => Math.floor(date.getTime() / 1000));
    const start = gapCheckedUnix > 0
        ? gapCheckedUnix
        : (edgeSeconds.length ? Math.min(...edgeSeconds) : supplyCursorUnix - 36 * 3600);
    if (!(supplyCursorUnix > start + 180)) {
        gapCheckedUnix = supplyCursorUnix || gapCheckedUnix;
        return;
    }

    let cursor = start;
    let previous = null;
    let firstPage = true;
    while (cursor < supplyCursorUnix) {
        const snap = await getDocs(query(
            collection(db, "meter_readings"),
            where("timestamp_unix", firstPage ? ">=" : ">", cursor),
            orderBy("timestamp_unix", "asc"),
            limit(200)
        ));
        firstPage = false;
        if (snap.empty) break;
        const rows = snap.docs.map(item => item.data()).filter(UI.isPlausibleMeterReading);
        for (const reading of rows) {
            const unix = Number(reading.timestamp_unix);
            const previousUnix = Number(previous?.timestamp_unix);
            if (previous && unix > previousUnix && Number(reading.voltage) >= 80 && Number(previous.voltage) >= 80 && unix - previousUnix >= 180) {
                adoptSilence(await outageInsideGap(previousUnix, unix));
            }
            previous = reading;
            if (unix >= supplyCursorUnix) break;
        }
        const last = Number(snap.docs[snap.docs.length - 1].data().timestamp_unix);
        if (!Number.isFinite(last) || last <= cursor) break;
        cursor = last;
        if (cursor >= supplyCursorUnix || snap.size < 200) break;
    }
    gapCheckedUnix = supplyCursorUnix;
    if (cachedSupplyEdges) cachedSupplyEdges.stateOn = supplyStateOn;
    supplyHistoryReady = true;
    UI.renderSupplyEdgeResult(edgesForDisplay());
    await saveSupplyState();
}

async function catchUpSupply(cursorUnix) {
    let cursor = cursorUnix;
    while (cursor) {
        const snap = await getDocs(query(
            collection(db, "meter_readings"),
            where("timestamp_unix", ">", cursor),
            orderBy("timestamp_unix", "asc"),
            limit(200)
        ));
        if (snap.empty) break;
        await enqueueSupplyTail(snap.docs.map(item => item.data()));
        const last = Number(snap.docs[snap.docs.length - 1].data().timestamp_unix);
        if (!Number.isFinite(last) || last <= cursor || snap.size < 200) break;
        cursor = last;
    }
}

async function ensureSupplyState() {
    if (supplyEnsureStarted) return;
    supplyEnsureStarted = true;
    const ref = doc(db, "esp32_settings", "supply_state");
    try {
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : null;
        const freshBuild = data?.building && data.updated_at?.toDate && Date.now() - data.updated_at.toDate().getTime() < 120000;
        if (data?.complete && Number.isFinite(Number(data.cursorUnix))) {
            restoreSupplyState(data);
            if (Number(data.edgeRule) !== LIGHT_EDGE_RULE) await rebuildLightEdges();
            else await repairUncheckedGaps();
            await catchUpSupply(supplyCursorUnix);
            supplyStateReady = true;
            await enqueueSupplyTail(supplyEdgeReadings);
            return;
        }
        if (freshBuild) {
            supplyEnsureStarted = false;
            setTimeout(ensureSupplyState, 4000);
            return;
        }
        await setDoc(ref, { building: true, updated_at: new Date() }, { merge: true });
        const recent = await getDocs(query(
            collection(db, "meter_readings"),
            orderBy("timestamp_unix", "desc"),
            limit(SUPPLY_EDGE_LIMIT)
        ));
        const newest = recent.docs.map(item => item.data()).find(UI.isPlausibleMeterReading);
        await extendSupplyEdges(recent.docs, newest ? Number(newest.voltage) >= 80 : null);
    } catch (err) {
        console.error("Supply state error:", err);
        supplyEnsureStarted = false;
    }
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
    Charts.updateLifepoChart(UI.lifepoDailyCharge(chargeHistory));
    if (meterDocs.length) Charts.updateStatsChart(meterDocs, UI.translations, currentLang, graphDocs);
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

function paintBoardLink() {
    UI.renderBoardLink(latestSupplyReading, currentDocs[0], currentLang);
}

function refreshData() {
    // ОТПРАВЛЯЕМ ПЕРЕВОДЫ В ГРАФИКИ
    Charts.updateChartConfig(UI.translations[currentLang]);
    paintBoardLink();
    if(currentDocs.length > 0) {
        UI.renderHome(currentDocs, currentLang);
    }
    if (latestSupplyReading) paintLiveSupply();
    else if (supplyHistoryReady && (cachedSupplyEdges || inverterOffAt)) UI.renderSupplyEdgeResult(edgesForDisplay());
    if (graphDocs.length > 0 || meterDocs.length > 0) refreshGraphs();
    paintChargeBalance();
    paintReserveCard();
}

function paintReserveCard() {
    const shown = latestSupplyReading ? UI.supplyReadingForDisplay(latestSupplyReading, currentDocs) : null;
    UI.renderReserveRuntime(shown, latestReserveEstimate, currentLang, latestChargeReading);
}

const BALANCE_KEY = "lifepo-balance-v1";
const balance = {
    started: false,
    capacityKwh: null,
    fullAt: null,
    remainingWh: null,
    intoWh: 0,
    outWh: 0,
    weekWh: 0,
    plugAfter: 0,
    meterAfter: 0,
    lastPlug: null,
    lastMeter: null,
    meterRelaxed: false,
    unsubs: []
};

function chargeTime(reading) {
    if (reading?.timestamp?.toDate) return reading.timestamp.toDate().getTime();
    const seconds = Number(reading?.timestamp?.seconds);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
}

function meterTime(reading) {
    const unix = Number(reading?.timestamp_unix);
    return Number.isFinite(unix) ? unix * 1000 : null;
}

function newestReading(readings, timeOf) {
    return readings.reduce((best, item) => {
        const t = timeOf(item);
        if (!Number.isFinite(t)) return best;
        if (!best || t > best.t) return { t, item };
        return best;
    }, null);
}

function asCharge(saved) {
    if (!saved || !Number.isFinite(saved.t)) return null;
    return {
        power: saved.power,
        on: saved.on === true,
        voltage: saved.voltage,
        timestamp: { toDate: () => new Date(saved.t) }
    };
}

function asMeter(saved) {
    if (!saved || !Number.isFinite(saved.t)) return null;
    return {
        voltage: saved.voltage,
        current: saved.current,
        power: saved.power,
        energy: saved.energy,
        timestamp_unix: Math.floor(saved.t / 1000)
    };
}

function readBalanceCache() {
    try {
        const parsed = JSON.parse(localStorage.getItem(BALANCE_KEY) || "null");
        if (!parsed || parsed.v !== 1 || !Number.isFinite(parsed.fullAt)) return null;
        return parsed;
    } catch (e) {
        return null;
    }
}

function writeBalanceCache() {
    if (!Number.isFinite(balance.fullAt)) return;
    localStorage.setItem(BALANCE_KEY, JSON.stringify({
        v: 1,
        capacityKwh: batteryCapacityKwh,
        fullAt: balance.fullAt,
        remainingWh: balance.remainingWh,
        intoWh: balance.intoWh,
        outWh: balance.outWh,
        weekWh: balance.weekWh,
        plugAfter: balance.plugAfter,
        meterAfter: balance.meterAfter,
        lastPlug: balance.lastPlug,
        lastMeter: balance.lastMeter,
        savedAt: Date.now()
    }));
}

let lifepoSaveTimer = 0;

function scheduleLifepoSave() {
    if (!Number.isFinite(balance.fullAt)) return;
    clearTimeout(lifepoSaveTimer);
    lifepoSaveTimer = setTimeout(() => {
        setDoc(doc(db, "esp32_settings", "lifepo_state"), {
            v: 1,
            capacityKwh: batteryCapacityKwh,
            fullAt: balance.fullAt,
            remainingWh: balance.remainingWh,
            intoWh: balance.intoWh || 0,
            outWh: balance.outWh || 0,
            weekWh: balance.weekWh || 0,
            plugAfter: balance.plugAfter || balance.fullAt,
            meterAfter: balance.meterAfter || balance.fullAt,
            lastPlug: balance.lastPlug,
            lastMeter: balance.lastMeter,
            building: false,
            savedAt: Date.now(),
            updated_at: new Date()
        }, { merge: true }).catch(err => console.error("LiFePO state save error:", err));
    }, 5000);
}

function applyBalanceRecord(record) {
    balance.fullAt = record.fullAt;
    balance.remainingWh = record.remainingWh;
    balance.intoWh = record.intoWh || 0;
    balance.outWh = record.outWh || 0;
    balance.weekWh = record.weekWh || 0;
    balance.plugAfter = record.plugAfter || record.fullAt;
    balance.meterAfter = record.meterAfter || record.fullAt;
    balance.lastPlug = record.lastPlug || null;
    balance.lastMeter = record.lastMeter || null;
    latestReserveEstimate = {
        ready: true,
        capacityKwh: record.capacityKwh,
        from: record.fullAt,
        to: record.savedAt || Date.now(),
        fullAt: record.fullAt,
        chargeAcWh: 0,
        intoBatteryWh: balance.intoWh,
        outOfBatteryWh: balance.outWh,
        weekBatteryWh: balance.weekWh,
        netWh: balance.intoWh - balance.outWh,
        lowWh: record.remainingWh,
        highWh: record.remainingWh
    };
    paintReserveCard();
    UI.renderChargeSoc(latestReserveEstimate, currentLang);
}

function paintBalanceEstimate() {
    UI.renderChargeSoc(latestReserveEstimate, currentLang);
    paintReserveCard();
    if (weekHistoryReady) Charts.updateLifepoChart(UI.lifepoDailyCharge(chargeHistory));
}

function paintCachedBalance() {
    const cache = readBalanceCache();
    if (!cache) return;
    balance.fullAt = cache.fullAt;
    balance.remainingWh = cache.remainingWh;
    balance.intoWh = cache.intoWh || 0;
    balance.outWh = cache.outWh || 0;
    balance.weekWh = cache.weekWh || 0;
    balance.plugAfter = cache.plugAfter || cache.fullAt;
    balance.meterAfter = cache.meterAfter || cache.fullAt;
    balance.lastPlug = cache.lastPlug || null;
    balance.lastMeter = cache.lastMeter || null;
    latestReserveEstimate = {
        ready: true,
        capacityKwh: cache.capacityKwh,
        from: cache.fullAt,
        to: cache.savedAt || Date.now(),
        fullAt: cache.fullAt,
        chargeAcWh: 0,
        intoBatteryWh: balance.intoWh,
        outOfBatteryWh: balance.outWh,
        weekBatteryWh: balance.weekWh,
        netWh: balance.intoWh - balance.outWh,
        lowWh: cache.remainingWh,
        highWh: cache.remainingWh
    };
    paintReserveCard();
    UI.renderChargeSoc(latestReserveEstimate, currentLang);
}

function rememberTail(plugs, meters) {
    const plug = newestReading(plugs, chargeTime);
    const meter = newestReading(meters, meterTime);
    if (plug) {
        balance.plugAfter = plug.t;
        balance.lastPlug = {
            t: plug.t,
            power: Number(plug.item.power),
            on: plug.item.on === true,
            voltage: Number(plug.item.voltage)
        };
    }
    if (meter) {
        balance.meterAfter = meter.t;
        balance.lastMeter = {
            t: meter.t,
            voltage: Number(meter.item.voltage),
            current: Number(meter.item.current),
            power: Number(meter.item.power),
            energy: Number(meter.item.energy)
        };
    }
}

function absorbBalance(plugs, meters) {
    const plugNew = plugs.filter(item => (chargeTime(item) || 0) > (balance.plugAfter || 0));
    const meterNew = meters.filter(item => (meterTime(item) || 0) > (balance.meterAfter || 0));
    if (!plugNew.length && !meterNew.length) return;
    const charges = [asCharge(balance.lastPlug), ...plugNew].filter(Boolean);
    const reserve = [asMeter(balance.lastMeter), ...meterNew].filter(Boolean);
    const anchored = UI.estimateLifepoReserve(reserve, charges, batteryCapacityKwh);
    const capWh = (batteryCapacityKwh > 0 ? batteryCapacityKwh : 2.4) * 1000;
    if (Number.isFinite(anchored.fullAt) && (!Number.isFinite(balance.fullAt) || anchored.fullAt > balance.fullAt + 60000)) {
        balance.fullAt = anchored.fullAt;
        balance.remainingWh = anchored.lowWh;
        balance.intoWh = anchored.intoBatteryWh;
        balance.outWh = anchored.outOfBatteryWh;
        balance.weekWh = anchored.weekBatteryWh;
    } else if (Number.isFinite(balance.fullAt)) {
        const delta = UI.estimateLifepoReserve(reserve, charges, batteryCapacityKwh, Date.now(), { findAnchor: false });
        balance.remainingWh = Math.min(capWh, Math.max(0, balance.remainingWh + delta.intoBatteryWh - delta.outOfBatteryWh));
        balance.intoWh += delta.intoBatteryWh;
        balance.outWh += delta.outOfBatteryWh;
    } else {
        latestReserveEstimate = anchored;
        rememberTail(plugNew, meterNew);
        paintBalanceEstimate();
        return;
    }
    latestReserveEstimate = {
        ready: true,
        capacityKwh: batteryCapacityKwh,
        from: balance.fullAt,
        to: Date.now(),
        fullAt: balance.fullAt,
        chargeAcWh: 0,
        intoBatteryWh: balance.intoWh,
        outOfBatteryWh: balance.outWh,
        weekBatteryWh: balance.weekWh,
        netWh: balance.intoWh - balance.outWh,
        lowWh: balance.remainingWh,
        highWh: balance.remainingWh
    };
    rememberTail(plugNew, meterNew);
    writeBalanceCache();
    scheduleLifepoSave();
    paintBalanceEstimate();
}

function stopHomeBalance() {
    balance.unsubs.forEach(stop => stop());
    balance.unsubs = [];
}

function meterBalanceQuery(startUnix, relaxed) {
    const parts = [where("timestamp_unix", ">", startUnix)];
    if (!relaxed) parts.push(where("power", ">", 25));
    parts.push(orderBy("timestamp_unix", "asc"));
    if (!relaxed) parts.push(orderBy("power", "asc"));
    return query(collection(db, "meter_readings"), ...parts);
}

function watchBalance(plugStart, meterStartUnix) {
    stopHomeBalance();
    const plugs = onSnapshot(query(
        collection(db, "lifepo_charge"),
        where("timestamp", ">", plugStart),
        orderBy("timestamp", "asc")
    ), (snapshot) => {
        absorbBalance(snapshot.docs.map(item => item.data()), []);
    }, (err) => console.error("Charge balance listener error:", err));
    const meters = onSnapshot(meterBalanceQuery(meterStartUnix, balance.meterRelaxed), (snapshot) => {
        absorbBalance([], snapshot.docs.map(item => item.data()));
    }, (err) => {
        if (!balance.meterRelaxed) {
            balance.meterRelaxed = true;
            const retry = onSnapshot(meterBalanceQuery(meterStartUnix, true), (snapshot) => {
                absorbBalance([], snapshot.docs.map(item => item.data()));
            }, (retryErr) => console.error("Charge meter listener error:", retryErr));
            balance.unsubs.push(retry);
        } else {
            console.error("Charge meter listener error:", err);
        }
    });
    balance.unsubs.push(plugs, meters);
}

function scheduleHomeBalance() {
    const run = () => ensureHomeBalance();
    if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 1200 });
    else setTimeout(run, 300);
}

async function ensureHomeBalance() {
    if (weekBalanceStarted || (balance.started && balance.capacityKwh === batteryCapacityKwh)) return;
    balance.started = true;
    balance.capacityKwh = batteryCapacityKwh;
    const local = readBalanceCache();
    let remote = null;
    try {
        const snap = await getDoc(doc(db, "esp32_settings", "lifepo_state"));
        if (snap.exists()) remote = snap.data();
    } catch (err) {
        console.error("LiFePO state read error:", err);
    }
    const remoteOk = remote && remote.v === 1 && remote.capacityKwh === batteryCapacityKwh && Number.isFinite(remote.fullAt);
    const localOk = local && local.capacityKwh === batteryCapacityKwh;
    const remoteFresh = !localOk || (remote?.savedAt || 0) >= (local?.savedAt || 0);
    if (remoteOk && remoteFresh) {
        applyBalanceRecord(remote);
        writeBalanceCache();
        watchBalance(new Date(balance.plugAfter), Math.floor(balance.meterAfter / 1000));
        return;
    }
    if (localOk) {
        paintCachedBalance();
        scheduleLifepoSave();
        watchBalance(new Date(balance.plugAfter || local.fullAt), Math.floor((balance.meterAfter || local.fullAt) / 1000));
        return;
    }
    const buildingAge = remote?.updated_at?.toDate ? Date.now() - remote.updated_at.toDate().getTime() : Infinity;
    if (remote?.building && buildingAge < 120000) {
        balance.started = false;
        setTimeout(ensureHomeBalance, 4000);
        return;
    }
    await setDoc(doc(db, "esp32_settings", "lifepo_state"), { building: true, updated_at: new Date() }, { merge: true });
    primeHomeBalance();
}

async function primeHomeBalance() {
    const since = sevenDaysStart();
    try {
        const plugs = await getDocs(query(
            collection(db, "lifepo_charge"),
            where("timestamp", ">=", since),
            orderBy("timestamp", "asc")
        ));
        let meters;
        try {
            meters = await getDocs(meterBalanceQuery(Math.floor(since.getTime() / 1000) - 1, false));
        } catch (e) {
            balance.meterRelaxed = true;
            meters = await getDocs(meterBalanceQuery(Math.floor(since.getTime() / 1000) - 1, true));
        }
        if (weekBalanceStarted) return;
        balance.fullAt = null;
        balance.plugAfter = 0;
        balance.meterAfter = 0;
        balance.lastPlug = null;
        balance.lastMeter = null;
        absorbBalance(plugs.docs.map(item => item.data()), meters.docs.map(item => item.data()));
        watchBalance(new Date(balance.plugAfter || since.getTime()), Math.floor((balance.meterAfter || since.getTime()) / 1000));
    } catch (e) {
        console.error("Charge balance load error:", e);
    }
}

let weekHistoryReady = false;
let weekBalanceStarted = false;

function paintChargeBalance() {
    if (!weekHistoryReady && !balance.started) return;
    if (weekHistoryReady) {
        latestReserveEstimate = (chargeHistory.length || socMeterDocs.length)
            ? UI.estimateLifepoReserve(socMeterDocs, chargeHistory, batteryCapacityKwh)
            : null;
        if (latestReserveEstimate?.fullAt) {
            balance.fullAt = latestReserveEstimate.fullAt;
            balance.remainingWh = latestReserveEstimate.lowWh;
            balance.intoWh = latestReserveEstimate.intoBatteryWh;
            balance.outWh = latestReserveEstimate.outOfBatteryWh;
            balance.weekWh = latestReserveEstimate.weekBatteryWh;
            balance.plugAfter = 0;
            balance.meterAfter = 0;
            balance.lastPlug = null;
            balance.lastMeter = null;
            rememberTail(chargeHistory, socMeterDocs);
            writeBalanceCache();
            scheduleLifepoSave();
        }
    }
    paintBalanceEstimate();
}

function startChargeBalance() {
    if (weekBalanceStarted) {
        paintChargeBalance();
        return;
    }
    weekBalanceStarted = true;
    stopHomeBalance();
    const since = sevenDaysStart();
    const qHistory = query(
        collection(db, "lifepo_charge"),
        where("timestamp", ">=", since),
        orderBy("timestamp", "asc")
    );
    onSnapshot(qHistory, (snapshot) => {
        chargeHistory = snapshot.docs.map(item => item.data());
        weekHistoryReady = socMeterDocs.length > 0 || chargeHistory.length > 0;
        paintChargeBalance();
    }, (err) => console.error("Charge balance listener error:", err));
    const listenMeters = (relaxed) => onSnapshot(meterBalanceQuery(Math.floor(since.getTime() / 1000) - 1, relaxed), (snapshot) => {
        socMeterDocs = snapshot.docs.map(item => item.data());
        weekHistoryReady = true;
        paintChargeBalance();
    }, (err) => {
        if (!relaxed) listenMeters(true);
        else console.error("Charge meter listener error:", err);
    });
    listenMeters(balance.meterRelaxed);
}

function startChargeListener() {
    if (chargeUnsubscribe) {
        UI.renderCharge(latestChargeReading, currentLang);
        return;
    }
    const qCharge = query(collection(db, "lifepo_charge"), orderBy("timestamp", "desc"), limit(1));
    chargeUnsubscribe = onSnapshot(qCharge, (snapshot) => {
        latestChargeReading = snapshot.empty ? null : snapshot.docs[0].data();
        UI.renderCharge(latestChargeReading, currentLang);
        paintReserveCard();
    }, (err) => {
        console.error("Charge listener error:", err);
        latestChargeReading = null;
        UI.renderCharge(null, currentLang);
    });
}

// === MONITORING LOGIC ===
function refreshMonitoringCards() {
    if (monDataCache.length === 0) return;
    const latest = UI.supplyReadingForDisplay(monDataCache[monDataCache.length - 1], currentDocs);
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
       if (latestSupplyReading) paintLiveSupply();
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
    const inputPlugInterval = document.getElementById('input-plug-interval');
    const inputPlugIp = document.getElementById('input-plug-ip');
    
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
    [inputPlugInterval, inputPlugIp].forEach((input) => {
        if (!input) return;
        input.disabled = true;
        input.classList.add('opacity-50');
    });

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
                if (latestSupplyReading) paintLiveSupply();
                paintChargeBalance();
            } else if (inputBattery && !inputBattery.value) {
                inputBattery.value = batteryCapacityKwh;
            }
            const plugInterval = Number(data.plug_interval);
            if (inputPlugInterval && Number.isFinite(plugInterval) && plugInterval >= 5) {
                inputPlugInterval.value = plugInterval;
            }
            if (inputPlugIp && typeof data.plug_ip === 'string' && data.plug_ip.trim()) {
                inputPlugIp.value = data.plug_ip.trim();
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
        [inputPlugInterval, inputPlugIp].forEach((input) => {
            if (!input) return;
            input.disabled = false;
            input.classList.remove('opacity-50');
        });
        scheduleHomeBalance();
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

function validPlugIp(value) {
    const parts = String(value || '').trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

async function savePlugSettingsToDB() {
    const inputInterval = document.getElementById('input-plug-interval');
    const inputIp = document.getElementById('input-plug-ip');
    const status = document.getElementById('plug-settings-status');
    const interval = parseInt(inputInterval.value, 10);
    const ip = inputIp.value.trim();

    if (!interval || interval < 5 || interval > 3600) {
        alert("Interval must be between 5 and 3600 seconds");
        return;
    }
    if (!validPlugIp(ip)) {
        alert("Enter an address like 192.168.31.205");
        return;
    }

    const btn = document.getElementById('btn-save-plug');
    const originalBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC);
        await setDoc(docRef, {
            plug_interval: interval,
            plug_ip: ip,
            updated_at: new Date()
        }, { merge: true });

        status.innerText = UI.translations[currentLang].msgSaved || "Saved!";
        status.className = "text-center text-sm font-medium h-5 transition-opacity opacity-100 text-green-500";
        setTimeout(() => status.classList.add('opacity-0'), 3000);
    } catch (e) {
        console.error("Error saving plug settings:", e);
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
        if (latestSupplyReading) paintLiveSupply();
        paintChargeBalance();

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
