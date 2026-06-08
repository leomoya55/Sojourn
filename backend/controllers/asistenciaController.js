const getAsistenciaByEstudiante = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM asistencia WHERE estudiante_id = ?', [req.params.estudiante_id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la asistencia' });
    }
};

const createAsistencia = async (req, res) => {
    const { estudiante_id, curso_id, fecha, presente } = req.body;
    try {
        await req.db.query('INSERT INTO asistencia (estudiante_id, curso_id, fecha, presente) VALUES (?, ?, ?, ?)', [estudiante_id, curso_id, fecha, presente]);
        res.status(201).json({ message: 'Asistencia registrada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar la asistencia' });
    }
};

module.exports = {
    getAsistenciaByEstudiante,
    createAsistencia,
};
