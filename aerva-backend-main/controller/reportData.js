const e = require("express");
const pool = require("./db_connection");
const excelJS = require("exceljs");
const fs = require("fs");
const path = require("path");


const allowedMetrics = {
    temperature: {
        column: "temperature",
        label: "Temperature",
        unit: "°C"
    },
    humidity: {
        column: "humidity",
        label: "Humidity",
        unit: "%"
    },
    co_ppm: {
        column: "co_ppm",
        label: "Carbon Monoxide",
        unit: "ppm"
    },
    o2_pct: {
        column: "o2_pct",
        label: "Oxygen",
        unit: "%"
    },
    co2_ppm: {
        column: "co2_ppm",
        label: "Carbon Dioxide",
        unit: "ppm"
    },
    pm1_0: {
        column: "pm1_0",
        label: "PM1.0",
        unit: "µg/m³"
    },
    pm2_5: {
        column: "pm2_5",
        label: "PM2.5",
        unit: "µg/m³"
    },
    pm10: {
        column: "pm10",
        label: "PM10",
        unit: "µg/m³"
    },
    rssi: {
        column: "rssi",
        label: "RSSI",
        unit: ""
    }
};

const rangeToInterval = {
    "1h": "1 hour",
    "24h": "24 hours",
    "7d": "7 days",
    "30d": "30 days"
};

const reportData = async (deviceMac,range) => {
    try{
        const interval = rangeToInterval[range];
        if (!interval) {
            throw new Error(`Invalid range: ${range}`);
        }

        const result = await pool.query(
            `SELECT * FROM mqtt_payload
            WHERE device_mac = $1 AND received_at >= NOW() - $2::interval
            ORDER BY received_at DESC`,
            [deviceMac, interval]
        );
            
        return (result.rows.map(row => ({
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
            }
        })));
        console.log("Data retrieved for Excel export:", result.rows.length, "rows");
    }catch(err){
        return reportDataFromFile(deviceMac, range);
    }   
}

function reportDataFromFile(deviceMac, range) {
    const records = loadSensorRecords().filter((r) => r.message.MAC === deviceMac);
    const selected = records.length ? records : loadSensorRecords();
    const countMap = { "1h": 12, "24h": 120, "7d": 420, "30d": 720 };
    const takeCount = countMap[range] || 120;

    return selected.slice(-takeCount).map((row, index) => ({
        id: index + 1,
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
        }
    }));
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

module.exports = { reportData };