const express = require('express');
const router = express.Router();
const { getAllCursos, createCurso, updateCurso, deleteCurso, asignarDocente } = require('../controllers/cursosController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllCursos);
router.post('/', restrictTo('administrador'), createCurso);
router.put('/:id', restrictTo('administrador'), updateCurso);
router.delete('/:id', restrictTo('administrador'), deleteCurso);
router.post('/:id/asignar-docente', restrictTo('administrador'), asignarDocente);

module.exports = router;
