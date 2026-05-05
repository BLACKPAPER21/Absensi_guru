const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Public routes
router.post('/login', authController.login);

// We will restrict this route later to admins only, but for now it's open for setup
router.post('/register', authController.register);

module.exports = router;
