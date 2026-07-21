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
// Límite ampliado para permitir imágenes (base64) en los comunicados.
app.use(express.json({ limit: '6mb' }));

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
const reportesRoutes = require('./routes/reportesRoutes');
const periodosRoutes = require('./routes/periodosRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/comunicados', comunicadosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/periodos', periodosRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is running and healthy' });
});

// Frontend estático (SPA) — AL FINAL, después de todas las rutas /api.
// El catch-all solo responde a rutas que NO empiezan con /api, para que las
// peticiones a la API no devuelvan el index.html por error.
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

        // Migraciones idempotentes (columnas nuevas y catálogo de materias).
        try {
            const { runMigrations } = require('./migrate');
            await runMigrations(pool);
        } catch (mErr) {
            console.error('Migraciones:', mErr.message);
        }

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
};

startServer();