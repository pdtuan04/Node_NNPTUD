const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statistic');

router.get('/most-booked-services', async (req, res) => {
    try {
        const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 0;
        const result = await statisticController.getMostBookedServices(limit);
        const response = {
            success: true,
            message: "Lấy danh sách thống kê thành công.",
            data: result
        };
        return res.status(200).json(response);
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await statisticController.getStatisticById(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu" });
        return res.status(200).json({ success: true, message: "Lấy chi tiết thành công", data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
router.get('/most-booked-services/export', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const format = (req.query.format || "csv").toLowerCase();
        let fileData;
        let fileName;
        let mediaType;
        if (format === "pdf") {
            fileData = await statisticController.exportMostBookedServicesToPdf(limit);
            fileName = "most-booked-services.pdf";
            mediaType = "application/pdf";
        } else {
            fileData = await statisticController.exportMostBookedServicesToCsv(limit);
            fileName = "most-booked-services.csv";
            mediaType = "text/csv";
        }
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", mediaType);
        return res.status(200).send(fileData);
    } catch (error) {
        return res.status(400).send();
    }
});
module.exports = router;
