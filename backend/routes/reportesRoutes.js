const express = require('express');
const router = express.Router();
const { getReportes } = require('../controllers/reportesController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', restrictTo('administrador'), getReportes);

module.exports = router;
