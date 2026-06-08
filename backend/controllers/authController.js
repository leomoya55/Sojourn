const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { nombre, apellido, email, password, rol_id } = req.body;

    if (!nombre || !apellido || !email || !password || !rol_id) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const db = req.db;
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO usuarios (nombre, apellido, email, password, rol_id) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido, email, hashedPassword, rol_id]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error en el registro:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y password son obligatorios' });
    }

    try {
        const db = req.db;
        const [rows] = await db.query(
            'SELECT u.*, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, rol: user.rol, nombre: user.nombre });
    } catch (error) {
        console.error('Error en el login:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = { register, login };
