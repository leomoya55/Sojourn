const express = require('express');
const router = express.Router();
const {
    getAsistenciaByEstudiante,
    getAsistenciaByCursoFecha,
    createAsistencia,
} = require('../controllers/asistenciaController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

// La ruta específica (materia + fecha) va antes que la de :estudiante_id.
router.get('/curso/:curso_id/:fecha', restrictTo('administrador', 'docente'), getAsistenciaByCursoFecha);
router.get('/:estudiante_id', getAsistenciaByEstudiante);
router.post('/', restrictTo('administrador', 'docente'), createAsistencia);

module.exports = router;
