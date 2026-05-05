const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(requireRole(['ADMIN', 'KEPSEK']));

// GET /api/reports/monthly?month=YYYY-MM
router.get('/monthly', reportController.generateMonthlyReport);
router.get('/monthly/pdf', reportController.generateMonthlyReportPDF);

module.exports = router;
