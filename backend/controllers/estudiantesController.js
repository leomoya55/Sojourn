const getAllEstudiantes = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM estudiantes');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los estudiantes' });
    }
};

const createEstudiante = async (req, res) => {
    const { nombre, apellido, fecha_nacimiento, direccion, telefono, email } = req.body;
    try {
        await req.db.query('INSERT INTO estudiantes (nombre, apellido, fecha_nacimiento, direccion, telefono, email) VALUES (?, ?, ?, ?, ?, ?)', [nombre, apellido, fecha_nacimiento, direccion, telefono, email]);
        res.status(201).json({ message: 'Estudiante creado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el estudiante' });
    }
};

const updateEstudiante = async (req, res) => {
    const { nombre, apellido, fecha_nacimiento, direccion, telefono, email } = req.body;
    try {
        await req.db.query('UPDATE estudiantes SET nombre = ?, apellido = ?, fecha_nacimiento = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?', [nombre, apellido, fecha_nacimiento, direccion, telefono, email, req.params.id]);
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
        await req.db.query('INSERT INTO estudiante_curso (estudiante_id, curso_id) VALUES (?, ?)', [estudiante_id, curso_id]);
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
