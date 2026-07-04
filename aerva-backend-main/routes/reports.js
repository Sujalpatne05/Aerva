const express = require("express");
const router = express.Router();
const { exportExcel } = require("../services/exportExcelService.js");
const { exportPDF } = require("../services/exportPDF.js");

async function handleExcel(req, res) {
    try {
        const { device_mac, range } = req.query;

        if (!device_mac || !range) {
            return res.status(400).json({ error: "Missing required query parameters" });
        }

        const data = await exportExcel(device_mac, range);
        if (!data || data.length === 0) {
            return res.status(404).json({ error: "No data found for the specified device and range" });
        }

        res.download(data, `report_${device_mac}_${range}.xlsx`, (err) => {
            if (err) {
                console.error("Error sending the file:", err);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
    } catch (err) {
        console.error("Error retrieving report data:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function handlePdf(req, res) {
    try {
        const { device_mac, range } = req.query;

        if (!device_mac || !range) {
            return res.status(400).json({ error: "Missing required query parameters" });
        }

        const data = await exportPDF(device_mac, range);
        if (!data || data.length === 0) {
            return res.status(404).json({ error: "No data found for the specified device and range" });
        }

        res.download(data, `report_${device_mac}_${range}.pdf`, (err) => {
            if (err) {
                console.error("Error sending the file:", err);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
    } catch (err) {
        console.error("Error retrieving report data:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

router.get("/excel", handleExcel);
router.get("/export", handleExcel);
router.get("/pdf", handlePdf);
router.get("/export-pdf", handlePdf);

module.exports = router;
