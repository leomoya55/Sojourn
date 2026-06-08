const express = require('express');
const router = express.Router();
const { getNotasByEstudiante, createNota, updateNota } = require('../controllers/notasController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/:estudiante_id', getNotasByEstudiante);
router.post('/', restrictTo('administrador', 'docente'), createNota);
router.put('/:id', restrictTo('administrador', 'docente'), updateNota);

module.exports = router;
