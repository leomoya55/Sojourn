// Comunicados institucionales, con imagen opcional y destinatarios específicos.
// Si un comunicado no tiene destinatarios, es para todos los padres.
const getAllComunicados = async (req, res) => {
    try {
        const [rows] = await req.db.query(
            `SELECT c.*, GROUP_CONCAT(cd.padre_id) AS destinatarios
             FROM comunicados c
             LEFT JOIN comunicado_destinatario cd ON cd.comunicado_id = c.id
             GROUP BY c.id
             ORDER BY c.fecha_publicacion DESC`
        );
        // El padre solo ve los comunicados globales o los dirigidos a él.
        let lista = rows;
        if (req.user && req.user.rol === 'padre') {
            lista = rows.filter(
                (c) => !c.destinatarios || String(c.destinatarios).split(',').includes(String(req.user.id))
            );
        }
        res.json(lista);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los comunicados' });
    }
};

const createComunicado = async (req, res) => {
    const { titulo, contenido, imagen, destinatarios } = req.body;
    const autor_id = req.user.id;
    try {
        const [result] = await req.db.query(
            'INSERT INTO comunicados (titulo, contenido, imagen, autor_id) VALUES (?, ?, ?, ?)',
            [titulo, contenido, imagen || null, autor_id]
        );
        const comunicadoId = result.insertId;

        // Destinatarios específicos (opcional). Vacío = para todos.
        if (Array.isArray(destinatarios) && destinatarios.length > 0) {
            const valores = destinatarios.map((pid) => [comunicadoId, Number(pid)]);
            await req.db.query('INSERT INTO comunicado_destinatario (comunicado_id, padre_id) VALUES ?', [valores]);
        }
        res.status(201).json({ message: 'Comunicado publicado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el comunicado' });
    }
};

const deleteComunicado = async (req, res) => {
    try {
        // La relación comunicado_destinatario se borra en cascada (FK).
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
