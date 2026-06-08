const getAllComunicados = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM comunicados ORDER BY fecha_publicacion DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los comunicados' });
    }
};

const createComunicado = async (req, res) => {
    const { titulo, contenido } = req.body;
    const autor_id = req.user.id; 
    try {
        await req.db.query('INSERT INTO comunicados (titulo, contenido, autor_id) VALUES (?, ?, ?)', [titulo, contenido, autor_id]);
        res.status(201).json({ message: 'Comunicado creado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el comunicado' });
    }
};

const deleteComunicado = async (req, res) => {
    try {
        await req.db.query('DELETE FROM comunicados WHERE id = ?', [req.params.id]);
        res.json({ message: 'Comunicado eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el comunicado' });
    }
};

module.exports = {
    getAllComunicados,
    createComunicado,
    deleteComunicado,
};
