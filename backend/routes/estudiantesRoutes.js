const express = require('express');
const router = express.Router();
const { getAllEstudiantes, createEstudiante, updateEstudiante, asignarCurso } = require('../controllers/estudiantesController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllEstudiantes);
router.post('/', restrictTo('administrador', 'docente'), createEstudiante);
router.put('/:id', restrictTo('administrador', 'docente'), updateEstudiante);
router.post('/:id/asignar-curso', restrictTo('administrador', 'docente'), asignarCurso);

module.exports = router;
