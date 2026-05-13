const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for memory storage (for Supabase upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Protect all routes
router.use(verifyToken);

router.post('/check-in', upload.single('photo'), attendanceController.checkIn);
router.post('/check-out', upload.single('photo'), attendanceController.checkOut);
router.get('/history', attendanceController.getHistory);

// Admin only routes
router.get('/today', requireRole(['ADMIN', 'KEPSEK']), attendanceController.getTodayAdmin);
router.get('/stats', requireRole(['ADMIN', 'KEPSEK']), attendanceController.getMonthlyStats);
router.get('/config', requireRole(['ADMIN', 'KEPSEK']), attendanceController.getConfig);
router.put('/config', requireRole(['ADMIN']), attendanceController.updateConfig);

module.exports = router;
