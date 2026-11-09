const fs = require('fs');
const path = require('path');
const TuyAPI = require('tuyapi');

const configPath = path.join(__dirname, '..', '..', 'tuya.local.json');
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const name = process.argv[2];
const plugs = (cfg.devices || []).filter((device) => device.ip && device.localKey && (!name || device.name === name));

if (plugs.length === 0) {
  console.error('В tuya.local.json нет розетки с локальным адресом.');
  process.exit(1);
}

function readingFrom(dps) {
  return {
    on: Boolean(dps['1']),
    voltage: Number(dps['20']) / 10,
    current: Number(dps['18']) / 1000,
    power: Number(dps['19']) / 10,
    energy: Number(dps['17']) / 1000,
  };
}

function readPlug(plug) {
  return new Promise((resolve, reject) => {
    const device = new TuyAPI({
      id: plug.deviceId,
      key: plug.localKey,
      ip: plug.ip,
      version: String(plug.version || '3.5'),
      issueGetOnConnect: true,
    });
    const timer = setTimeout(() => {
      device.disconnect();
      reject(new Error(`${plug.name}: нет ответа`));
    }, 8000);
    device.on('data', (data) => {
      clearTimeout(timer);
      device.disconnect();
      resolve({ name: plug.name, ip: plug.ip, ...readingFrom(data.dps || data) });
    });
    device.on('error', (error) => {
      clearTimeout(timer);
      device.disconnect();
      reject(error);
    });
    device.connect().catch((error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

(async () => {
  for (const plug of plugs) {
    const reading = await readPlug(plug);
    console.log(
      `${reading.name}  ${reading.on ? 'вкл' : 'выкл'}  ` +
      `${reading.voltage.toFixed(1)} В  ` +
      `${reading.current.toFixed(3)} А  ` +
      `${reading.power.toFixed(1)} Вт  ` +
      `${reading.energy.toFixed(3)} кВт·ч`
    );
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
