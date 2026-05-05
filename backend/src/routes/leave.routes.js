const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/leaves');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-leave-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// Protect all routes
router.use(verifyToken);

// Guru Routes
router.post('/request', requireRole(['GURU']), upload.single('attachment'), leaveController.submitRequest);
router.get('/my-requests', requireRole(['GURU']), leaveController.getMyRequests);

// Admin Routes
router.get('/all', requireRole(['ADMIN', 'KEPSEK']), leaveController.getAllRequests);
router.put('/:id/status', requireRole(['ADMIN', 'KEPSEK']), leaveController.updateStatus);

module.exports = router;
