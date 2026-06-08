const express = require('express');
const router = express.Router();
const { getAsistenciaByEstudiante, createAsistencia } = require('../controllers/asistenciaController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/:estudiante_id', getAsistenciaByEstudiante);
router.post('/', restrictTo('administrador', 'docente'), createAsistencia);

module.exports = router;
