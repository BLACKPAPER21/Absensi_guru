const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/today', scheduleController.getTodaySchedule);
router.get('/', requireRole(['ADMIN', 'KEPSEK']), scheduleController.getAllSchedules);
router.post('/', requireRole(['ADMIN']), scheduleController.createSchedule);
router.put('/:id', requireRole(['ADMIN']), scheduleController.updateSchedule);
router.delete('/:id', requireRole(['ADMIN']), scheduleController.deleteSchedule);

module.exports = router;
