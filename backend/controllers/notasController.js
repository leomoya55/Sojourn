const getNotasByEstudiante = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM notas WHERE estudiante_id = ?', [req.params.estudiante_id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las notas' });
    }
};

const createNota = async (req, res) => {
    const { estudiante_id, curso_id, nota, observacion } = req.body;
    try {
        await req.db.query('INSERT INTO notas (estudiante_id, curso_id, nota, observacion) VALUES (?, ?, ?, ?)', [estudiante_id, curso_id, nota, observacion]);
        res.status(201).json({ message: 'Nota creada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la nota' });
    }
};

const updateNota = async (req, res) => {
    const { nota, observacion } = req.body;
    try {
        await req.db.query('UPDATE notas SET nota = ?, observacion = ? WHERE id = ?', [nota, observacion, req.params.id]);
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
