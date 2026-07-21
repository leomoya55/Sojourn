const { canViewStudent } = require('../utils/scope');

// Estados válidos de asistencia (Bitácora 06, spec de la institución).
//   presente     — asistió normalmente
//   ausente      — no asistió (sin justificación)
//   tardia       — llegó tarde (cuenta como asistencia física)
//   justificada  — ausencia justificada
const ESTADOS = ['presente', 'ausente', 'tardia', 'justificada'];

// Para la retrocompatibilidad con el campo booleano `presente` (que aún usan
// versiones previas del frontend y varias consultas de reportes): se considera
// que el estudiante "asistió" cuando estuvo físicamente presente.
const asistio = (estado) => estado === 'presente' || estado === 'tardia';

// Normaliza el estado recibido. Acepta el nuevo campo `estado` o, si viene de
// un cliente antiguo, lo deriva del booleano `presente`.
const normalizarEstado = ({ estado, presente }) => {
    if (estado != null) {
        const e = String(estado).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        return ESTADOS.includes(e) ? e : null;
    }
    if (presente != null) return presente ? 'presente' : 'ausente';
    return null;
};

// GET /api/asistencia/:estudiante_id
// Historial de asistencia de un estudiante. El padre solo puede ver a sus hijos.
const getAsistenciaByEstudiante = async (req, res) => {
    try {
        const permitido = await canViewStudent(req.db, req.user, req.params.estudiante_id);
        if (!permitido) {
            return res.status(403).json({ message: 'No tiene permiso para ver este estudiante' });
        }
        const [rows] = await req.db.query(
            `SELECT a.*, c.nombre AS curso_nombre
             FROM asistencia a
             LEFT JOIN cursos c ON c.id = a.curso_id
             WHERE a.estudiante_id = ?
             ORDER BY a.fecha DESC`,
            [req.params.estudiante_id]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la asistencia' });
    }
};

// GET /api/asistencia/curso/:curso_id/:fecha
// Registros de una sesión (materia + fecha), para que el docente cargue lo ya
// marcado y pueda editarlo. Solo docente/administrador.
const getAsistenciaByCursoFecha = async (req, res) => {
    try {
        const { curso_id, fecha } = req.params;
        const [rows] = await req.db.query(
            'SELECT * FROM asistencia WHERE curso_id = ? AND fecha = ?',
            [curso_id, fecha]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la asistencia de la sesión' });
    }
};

// POST /api/asistencia
// Crea o actualiza (upsert) el registro de un estudiante para una materia/fecha.
// Guarda el estado (4 posibles), quién lo registró y mantiene sincronizado el
// booleano `presente` para retrocompatibilidad.
const createAsistencia = async (req, res) => {
    const { estudiante_id, curso_id, fecha } = req.body;
    const estado = normalizarEstado(req.body);

    if (!estudiante_id || !curso_id || !fecha) {
        return res.status(400).json({ message: 'estudiante_id, curso_id y fecha son obligatorios' });
    }
    if (!estado) {
        return res.status(400).json({ message: `Estado inválido. Use uno de: ${ESTADOS.join(', ')}` });
    }

    const registrado_por = req.user?.id || null;
    try {
        await req.db.query(
            `INSERT INTO asistencia (estudiante_id, curso_id, fecha, estado, presente, registrado_por)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                estado = VALUES(estado),
                presente = VALUES(presente),
                registrado_por = VALUES(registrado_por)`,
            [estudiante_id, curso_id, fecha, estado, asistio(estado) ? 1 : 0, registrado_por]
        );
        res.status(201).json({ message: 'Asistencia registrada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar la asistencia' });
    }
};

module.exports = {
    getAsistenciaByEstudiante,
    getAsistenciaByCursoFecha,
    createAsistencia,
    ESTADOS,
};
