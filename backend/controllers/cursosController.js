const getAllCursos = async (req, res) => {
    try {
        // Incluye el/los docente(s) asignado(s) mediante la relación curso_docente.
        const [rows] = await req.db.query(
            `SELECT c.*,
                    MIN(cd.docente_id) AS docente_id,
                    GROUP_CONCAT(DISTINCT cd.docente_id) AS docente_ids,
                    GROUP_CONCAT(DISTINCT CONCAT(u.nombre, ' ', u.apellido) SEPARATOR ', ') AS docente_nombre
             FROM cursos c
             LEFT JOIN curso_docente cd ON cd.curso_id = c.id
             LEFT JOIN usuarios u ON u.id = cd.docente_id
             WHERE c.activo = true
             GROUP BY c.id`
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los cursos' });
    }
};

const createCurso = async (req, res) => {
    const { nombre, descripcion, nivel, componente_evaluacion } = req.body;
    try {
        await req.db.query(
            'INSERT INTO cursos (nombre, descripcion, nivel, componente_evaluacion) VALUES (?, ?, ?, ?)',
            [nombre, descripcion || null, nivel || null, componente_evaluacion || 'PRUEBAS']
        );
        res.status(201).json({ message: 'Materia creada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la materia' });
    }
};

const updateCurso = async (req, res) => {
    const { nombre, descripcion, nivel, componente_evaluacion } = req.body;
    try {
        await req.db.query(
            'UPDATE cursos SET nombre = ?, descripcion = ?, nivel = ?, componente_evaluacion = ? WHERE id = ?',
            [nombre, descripcion || null, nivel || null, componente_evaluacion || 'PRUEBAS', req.params.id]
        );
        res.json({ message: 'Materia actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la materia' });
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
        // INSERT IGNORE evita el error si el docente ya estaba asignado a ese curso.
        await req.db.query('INSERT IGNORE INTO curso_docente (curso_id, docente_id) VALUES (?, ?)', [curso_id, docente_id]);
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
