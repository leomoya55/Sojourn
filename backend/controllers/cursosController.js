const getAllCursos = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM cursos WHERE activo = true');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los cursos' });
    }
};

const createCurso = async (req, res) => {
    const { nombre, descripcion } = req.body;
    try {
        await req.db.query('INSERT INTO cursos (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
        res.status(201).json({ message: 'Curso creado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el curso' });
    }
};

const updateCurso = async (req, res) => {
    const { nombre, descripcion } = req.body;
    try {
        await req.db.query('UPDATE cursos SET nombre = ?, descripcion = ? WHERE id = ?', [nombre, descripcion, req.params.id]);
        res.json({ message: 'Curso actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el curso' });
    }
};

const deleteCurso = async (req, res) => {
    try {
        await req.db.query('UPDATE cursos SET activo = false WHERE id = ?', [req.params.id]);
        res.json({ message: 'Curso desactivado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al desactivar el curso' });
    }
};

const asignarDocente = async (req, res) => {
    const { docente_id } = req.body;
    const curso_id = req.params.id;
    try {
        // Esto asume que tienes una tabla `curso_docente` para manejar la relación
        await req.db.query('INSERT INTO curso_docente (curso_id, docente_id) VALUES (?, ?)', [curso_id, docente_id]);
        res.json({ message: 'Docente asignado correctamente al curso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al asignar el docente' });
    }
};


module.exports = {
    getAllCursos,
    createCurso,
    updateCurso,
    deleteCurso,
    asignarDocente,
};
