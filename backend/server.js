// Importar dependencias
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

// Configuración inicial
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Pool de conexiones a MySQL
let dbConfig;

if (process.env.JAWSDB_URL) {
    const url = new URL(process.env.JAWSDB_URL);
    dbConfig = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
} else {
    dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

const pool = mysql.createPool(dbConfig);

// Middleware para adjuntar el pool de DB a cada request
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Rutas
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const cursosRoutes = require('./routes/cursosRoutes');
const estudiantesRoutes = require('./routes/estudiantesRoutes');
const notasRoutes = require('./routes/notasRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const comunicadosRoutes = require('./routes/comunicadosRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/comunicados', comunicadosRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is running and healthy' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Iniciar servidor
const startServer = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the database.');
        connection.release();

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
};

startServer();