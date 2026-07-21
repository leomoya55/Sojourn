const getAllEstudiantes = async (req, res) => {
    try {
        // Incluye el padre asociado y la lista de cursos en los que está matriculado.
        const [rows] = await req.db.query(
            `SELECT e.*,
                    CONCAT(p.nombre, ' ', p.apellido) AS padre_nombre,
                    GROUP_CONCAT(DISTINCT ec.curso_id) AS cursos_ids
             FROM estudiantes e
             LEFT JOIN usuarios p ON p.id = e.padre_id
             LEFT JOIN estudiante_curso ec ON ec.estudiante_id = e.id
             GROUP BY e.id`
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los estudiantes' });
    }
};

const createEstudiante = async (req, res) => {
    const { nombre, apellido, fecha_nacimiento, direccion, telefono, email, nivel, padre_id } = req.body;
    try {
        await req.db.query(
            'INSERT INTO estudiantes (nombre, apellido, fecha_nacimiento, direccion, telefono, email, nivel, padre_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, fecha_nacimiento || null, direccion || null, telefono || null, email || null, nivel || null, padre_id || null]
        );
        res.status(201).json({ message: 'Estudiante creado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el estudiante' });
    }
};

const updateEstudiante = async (req, res) => {
    const { nombre, apellido, fecha_nacimiento, direccion, telefono, email, nivel, padre_id } = req.body;
    try {
        await req.db.query(
            'UPDATE estudiantes SET nombre = ?, apellido = ?, fecha_nacimiento = ?, direccion = ?, telefono = ?, email = ?, nivel = ?, padre_id = ? WHERE id = ?',
            [nombre, apellido, fecha_nacimiento || null, direccion || null, telefono || null, email || null, nivel || null, padre_id || null, req.params.id]
        );
        res.json({ message: 'Estudiante actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el estudiante' });
    }
};

const asignarCurso = async (req, res) => {
    const { curso_id } = req.body;
    const estudiante_id = req.params.id;
    try {
        await req.db.query('INSERT IGNORE INTO estudiante_curso (estudiante_id, curso_id) VALUES (?, ?)', [estudiante_id, curso_id]);
        res.json({ message: 'Estudiante asignado al curso correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al asignar el curso' });
    }
};

module.exports = {
    getAllEstudiantes,
    createEstudiante,
    updateEstudiante,
    asignarCurso,
};
