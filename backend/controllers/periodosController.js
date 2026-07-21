// Gestión de períodos académicos (Bitácora 08).
const getAllPeriodos = async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM periodos ORDER BY fecha_inicio, id');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los períodos' });
    }
};

const createPeriodo = async (req, res) => {
    const { codigo, nombre, fecha_inicio, fecha_fin } = req.body;
    if (!codigo || !nombre) {
        return res.status(400).json({ message: 'El código y el nombre son obligatorios' });
    }
    try {
        await req.db.query(
            'INSERT INTO periodos (codigo, nombre, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?)',
            [codigo, nombre, fecha_inicio || null, fecha_fin || null, 'activo']
        );
        res.status(201).json({ message: 'Período creado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el período' });
    }
};

// Actualiza datos y/o estado (activar / cerrar) de un período.
const updatePeriodo = async (req, res) => {
    const { codigo, nombre, fecha_inicio, fecha_fin, estado } = req.body;
    try {
        const [rows] = await req.db.query('SELECT * FROM periodos WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Período no encontrado' });
        }
        const p = rows[0];
        await req.db.query(
            'UPDATE periodos SET codigo = ?, nombre = ?, fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?',
            [
                codigo ?? p.codigo,
                nombre ?? p.nombre,
                fecha_inicio ?? p.fecha_inicio,
                fecha_fin ?? p.fecha_fin,
                estado ?? p.estado,
                req.params.id,
            ]
        );
        res.json({ message: 'Período actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el período' });
    }
};

module.exports = { getAllPeriodos, createPeriodo, updatePeriodo };
