const express = require('express');
const router = express.Router();
const { getAllComunicados, createComunicado, deleteComunicado } = require('../controllers/comunicadosController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllComunicados);
router.post('/', restrictTo('administrador'), createComunicado);
router.delete('/:id', restrictTo('administrador'), deleteComunicado);

module.exports = router;
