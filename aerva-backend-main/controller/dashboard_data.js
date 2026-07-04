const pool = require("./db_connection");
const fs = require("fs");
const path = require("path");


const retrivelLatestData = async () => {
    try{
    const result = await pool.query("SELECT * FROM mqtt_payload ORDER BY id DESC LIMIT 1")
    
    const row = result.rows[0];
    if( !row) {
            console.error("Error retrieving latest data:", err);
            throw err;
        };
    return {
                id: row.id,
            device_mac: row.device_mac,
            received_at: row.received_at,

            readings: {
                temperature: Number(row.temperature),
                humidity: Number(row.humidity),
                co_ppm: Number(row.co_ppm),
                o2_pct: Number(row.o2_pct),
                co2_ppm: Number(row.co2_ppm),
                pm1_0: Number(row.pm1_0),
                pm2_5: Number(row.pm2_5),
                pm10: Number(row.pm10),
                rssi: Number(row.rssi)
            },

            status: {
                o2_warn: row.o2_warn,
                time_status: row.time_status,
                mqtt_err: Number(row.mqtt_err)
            }
    };
}catch (err) {
        return latestFromFile();
    }}

const allowedMetrics = {
    temperature: "temperature",
    humidity: "humidity",
    co_ppm: "co_ppm",
    o2_pct: "o2_pct",
    co2_ppm: "co2_ppm",
    pm1_0: "pm1_0",
    pm2_5: "pm2_5",
    pm10: "pm10",
    rssi: "rssi"
};

const rangeToInterval = {
    "1h": "1 hour",
    "24h": "24 hours",
    "7d": "7 days",
    "30d": "30 days"
};
const graphDataRetrieval = async ({ deviceMac, metric, range }) => {
    try{
        const columnName = allowedMetrics[metric];
        if (!columnName) {
            throw new Error(`Invalid metric: ${metric}`);
        }
        
        const interval = rangeToInterval[range];
        if (!interval) {
            throw new Error(`Invalid range: ${range}`);
        }

        const result = await pool.query(
            `SELECT 
                received_at AS time,
                ${columnName} AS value
            FROM mqtt_payload
            WHERE device_mac = $1 AND received_at >= NOW() - $2::interval
            ORDER BY received_at ASC
            `,
            [deviceMac, interval]
        )
        return {
            device_mac: deviceMac,
            metric,
            range,
            points: result.rows.map(row => ({
                time: row.time,
                value: row.value === null ? null : Number(row.value)
            }))
        };
    }catch (err) {
        return graphFromFile({ deviceMac, metric, range });
    }
}

function latestFromFile() {
    const records = loadSensorRecords();
    const row = records[records.length - 1];
    if (!row) {
        throw new Error("No fallback payload data found");
    }
    return toDashboardPayload(row, records.length);
}

function graphFromFile({ deviceMac, metric, range }) {
    const records = loadSensorRecords().filter((r) => r.message?.MAC === deviceMac);
    const selected = records.length ? records : loadSensorRecords();
    const countMap = { "1h": 12, "24h": 120, "7d": 420, "30d": 720 };
    const takeCount = countMap[range] || 120;
    const slice = selected.slice(-takeCount);
    const points = slice.map((r) => ({
        time: r.receivedAt,
        value: metricValueFromMessage(r.message, metric)
    }));

    return {
        device_mac: deviceMac,
        metric,
        range,
        points
    };
}

function loadSensorRecords() {
    const filePath = path.join(__dirname, "..", "data", "payloads.json");
    const text = fs.readFileSync(filePath, "utf8");
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        })
        .filter((row) => row && row.message && row.message.env && row.message.gas && row.message.pm);
}

function toDashboardPayload(row, fallbackId) {
    return {
        id: fallbackId,
        device_mac: row.message.MAC,
        received_at: row.receivedAt,
        readings: {
            temperature: Number(row.message.env.temp),
            humidity: Number(row.message.env.hum),
            co_ppm: Number(row.message.gas.co_ppm),
            o2_pct: Number(row.message.gas.o2_pct),
            co2_ppm: Number(row.message.gas.co2_ppm),
            pm1_0: Number(row.message.pm.pm1_0),
            pm2_5: Number(row.message.pm.pm2_5),
            pm10: Number(row.message.pm.pm10),
            rssi: Number(row.message.diag?.rssi)
        },
        status: {
            o2_warn: !!row.message.diag?.o2_warn,
            time_status: row.message.TIME_STATUS || "OK",
            mqtt_err: Number(row.message.diag?.mqtt_err || 0)
        }
    };
}

function metricValueFromMessage(message, metric) {
    switch (metric) {
        case "temperature": return toNum(message.env?.temp);
        case "humidity": return toNum(message.env?.hum);
        case "co_ppm": return toNum(message.gas?.co_ppm);
        case "o2_pct": return toNum(message.gas?.o2_pct);
        case "co2_ppm": return toNum(message.gas?.co2_ppm);
        case "pm1_0": return toNum(message.pm?.pm1_0);
        case "pm2_5": return toNum(message.pm?.pm2_5);
        case "pm10": return toNum(message.pm?.pm10);
        case "rssi": return toNum(message.diag?.rssi);
        default: return null;
    }
}

function toNum(value) {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
}
module.exports = { retrivelLatestData, graphDataRetrieval };