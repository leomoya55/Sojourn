const getAllUsuarios = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT id, nombre, apellido, email, rol_id, activo FROM usuarios');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};

const getUsuarioById = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT id, nombre, apellido, email, rol_id, activo FROM usuarios WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el usuario' });
    }
};

const updateUsuario = async (req, res) => {
    const { nombre, apellido, email, rol_id } = req.body;
    try {
        await req.db.query('UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, rol_id = ? WHERE id = ?', [nombre, apellido, email, rol_id, req.params.id]);
        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
};

const setActivoUsuario = async (req, res) => {
    const { activo } = req.body;
    try {
        await req.db.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo ? 1 : 0, req.params.id]);
        res.json({ message: activo ? 'Usuario activado correctamente' : 'Usuario desactivado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar el estado del usuario' });
    }
};

const deleteUsuario = async (req, res) => {
    try {
        await req.db.query('UPDATE usuarios SET activo = false WHERE id = ?', [req.params.id]);
        res.json({ message: 'Usuario desactivado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al desactivar el usuario' });
    }
};

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    updateUsuario,
    setActivoUsuario,
    deleteUsuario,
};
