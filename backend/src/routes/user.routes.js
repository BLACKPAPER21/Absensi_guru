const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(requireRole(['ADMIN', 'KEPSEK']));

router.get('/teachers', userController.getTeachers);
router.post('/teachers', userController.createTeacher);
router.put('/teachers/:id', userController.updateTeacher);
router.delete('/teachers/:id', userController.deleteTeacher);

module.exports = router;
