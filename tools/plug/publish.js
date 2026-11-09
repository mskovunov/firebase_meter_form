process.env.DEBUG = '';
const fs = require('fs');
const path = require('path');
const TuyAPI = require('tuyapi');

const configPath = path.join(__dirname, '..', '..', 'tuya.local.json');
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const plug = (cfg.devices || []).find((device) => device.name === 'ecoFlow' && device.ip && device.localKey);
const PROJECT = 'meter-form';
const API_KEY = 'AIzaSyAsr-JbArcAu-7_csBxM6VDsC7hyPz7qB0';
const DEFAULT_INTERVAL_MS = 30000;
const DEFAULT_IP = '192.168.31.205';

if (!plug) {
  console.error('ecoFlow не найден в tuya.local.json');
  process.exit(1);
}

function readingFrom(dps) {
  return {
    on: Boolean(dps['1']),
    voltage: Math.round(Number(dps['20'])) / 10,
    current: Math.round(Number(dps['18'])) / 1000,
    power: Math.round(Number(dps['19'])) / 10,
    energy: Math.round(Number(dps['17'])) / 1000,
  };
}

function readPlug(ip) {
  return new Promise((resolve, reject) => {
    const device = new TuyAPI({
      id: plug.deviceId,
      key: plug.localKey,
      ip,
      version: String(plug.version || '3.5'),
      issueGetOnConnect: true,
    });
    const timer = setTimeout(() => {
      device.disconnect();
      reject(new Error('нет ответа от розетки'));
    }, 8000);
    device.on('data', (data) => {
      clearTimeout(timer);
      device.disconnect();
      resolve(readingFrom(data.dps || data));
    });
    device.on('error', (error) => {
      clearTimeout(timer);
      try { device.disconnect(); } catch (e) {}
      reject(error);
    });
    device.connect().catch((error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function localStamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function publish(reading) {
  const now = new Date();
  const body = {
    fields: {
      voltage: { doubleValue: reading.voltage },
      current: { doubleValue: reading.current },
      power: { doubleValue: reading.power },
      energy: { doubleValue: reading.energy },
      on: { booleanValue: reading.on },
      created_at: { stringValue: localStamp(now) },
      timestamp: { timestampValue: now.toISOString() },
    },
  };
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/lifepo_charge?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = payload.error && payload.error.message ? payload.error.message : response.statusText;
    throw new Error(message);
  }
}

async function loadPlugSettings() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/esp32_settings/config?key=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return { intervalMs: DEFAULT_INTERVAL_MS, ip: plug.ip || DEFAULT_IP };
    const json = await response.json();
    const fields = json.fields || {};
    const intervalRaw = fields.plug_interval && (fields.plug_interval.integerValue || fields.plug_interval.doubleValue);
    const intervalSec = Number(intervalRaw);
    const ipRaw = fields.plug_ip && fields.plug_ip.stringValue;
    const ip = typeof ipRaw === 'string' && ipRaw.trim() ? ipRaw.trim() : (plug.ip || DEFAULT_IP);
    const intervalMs = Number.isFinite(intervalSec) && intervalSec >= 5 && intervalSec <= 3600
      ? intervalSec * 1000
      : DEFAULT_INTERVAL_MS;
    return { intervalMs, ip };
  } catch {
    return { intervalMs: DEFAULT_INTERVAL_MS, ip: plug.ip || DEFAULT_IP };
  }
}

async function tick() {
  const settings = await loadPlugSettings();
  try {
    const reading = await readPlug(settings.ip);
    await publish(reading);
    console.log(
      `${localStamp(new Date())}  ${settings.ip}  каждые ${settings.intervalMs / 1000} с  ` +
      `${reading.on ? 'вкл' : 'выкл'}  ` +
      `${reading.voltage.toFixed(1)} В  ${reading.current.toFixed(3)} А  ` +
      `${reading.power.toFixed(1)} Вт  ${reading.energy.toFixed(3)} кВт·ч`
    );
  } catch (error) {
    console.error(`${localStamp(new Date())}  ${error.message || error}`);
  }
  setTimeout(tick, settings.intervalMs);
}

tick();
