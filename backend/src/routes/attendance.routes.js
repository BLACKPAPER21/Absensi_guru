const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/attendance');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

module.exports = router;
