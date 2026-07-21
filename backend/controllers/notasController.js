const { canViewStudent } = require('../utils/scope');

const getNotasByEstudiante = async (req, res) => {
    try {
        // El padre solo puede consultar las notas de sus propios hijos.
        const permitido = await canViewStudent(req.db, req.user, req.params.estudiante_id);
        if (!permitido) {
            return res.status(403).json({ message: 'No tiene permiso para ver este estudiante' });
        }
        // Incluye el nombre del curso y del período para mostrarlos en el portal.
        const [rows] = await req.db.query(
            `SELECT n.*, c.nombre AS curso_nombre, p.nombre AS periodo_nombre, p.codigo AS periodo_codigo
             FROM notas n
             JOIN cursos c ON c.id = n.curso_id
             LEFT JOIN periodos p ON p.id = n.periodo_id
             WHERE n.estudiante_id = ?
             ORDER BY n.curso_id, n.periodo`,
            [req.params.estudiante_id]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las notas' });
    }
};

const createNota = async (req, res) => {
    const { estudiante_id, curso_id, nota, periodo, periodo_id, observacion } = req.body;
    try {
        // Upsert: una sola nota por estudiante/curso/período. Si ya existe, se
        // actualiza (corregir una nota no genera duplicados).
        await req.db.query(
            `INSERT INTO notas (estudiante_id, curso_id, nota, periodo, periodo_id, observacion)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE nota = VALUES(nota), periodo = VALUES(periodo), observacion = VALUES(observacion)`,
            [estudiante_id, curso_id, nota, periodo || null, periodo_id || null, observacion || null]
        );
        res.status(201).json({ message: 'Nota guardada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la nota' });
    }
};

const updateNota = async (req, res) => {
    const { nota, periodo, periodo_id, observacion } = req.body;
    try {
        await req.db.query(
            'UPDATE notas SET nota = ?, periodo = ?, periodo_id = ?, observacion = ? WHERE id = ?',
            [nota, periodo || null, periodo_id || null, observacion || null, req.params.id]
        );
        res.json({ message: 'Nota actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la nota' });
    }
};

module.exports = {
    getNotasByEstudiante,
    createNota,
    updateNota,
};
