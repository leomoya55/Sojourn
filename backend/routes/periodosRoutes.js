const express = require('express');
const router = express.Router();
const { getAllPeriodos, createPeriodo, updatePeriodo } = require('../controllers/periodosController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllPeriodos);
router.post('/', restrictTo('administrador'), createPeriodo);
router.put('/:id', restrictTo('administrador'), updatePeriodo);

module.exports = router;
