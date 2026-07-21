// Reportes generales para el administrador (Bitácora 08).
// Devuelve: asistencia por materia, rendimiento por materia y estudiantes con
// bajo rendimiento. Incluye el nivel de cada materia y solo lista las materias
// que tienen registros (para no mostrar todo el catálogo vacío).
const getReportes = async (req, res) => {
    try {
        const db = req.db;

        // Desglose por estado de asistencia (presente / ausente / tardía /
        // justificada). `presentes` y `porcentaje` se mantienen para la
        // retrocompatibilidad con las exportaciones existentes; "asistió" =
        // presente o tardía (estuvo físicamente en clase).
        const [asistenciaPorCurso] = await db.query(
            `SELECT c.id, c.nombre, c.nivel,
                    COUNT(a.id) AS total_registros,
                    COALESCE(SUM(a.estado IN ('presente','tardia')), 0) AS presentes,
                    COALESCE(SUM(a.estado = 'ausente'), 0)     AS ausentes,
                    COALESCE(SUM(a.estado = 'tardia'), 0)      AS tardias,
                    COALESCE(SUM(a.estado = 'justificada'), 0) AS justificadas,
                    ROUND(100 * COALESCE(SUM(a.estado IN ('presente','tardia')), 0) / NULLIF(COUNT(a.id), 0), 1) AS porcentaje
             FROM cursos c
             JOIN asistencia a ON a.curso_id = c.id
             WHERE c.activo = true
             GROUP BY c.id
             ORDER BY c.nombre, c.nivel`
        );

        const [rendimientoPorCurso] = await db.query(
            `SELECT c.id, c.nombre, c.nivel,
                    ROUND(AVG(n.nota), 2) AS promedio,
                    COUNT(n.id) AS cantidad_notas
             FROM cursos c
             JOIN notas n ON n.curso_id = c.id
             WHERE c.activo = true
             GROUP BY c.id
             ORDER BY c.nombre, c.nivel`
        );

        const [bajoRendimiento] = await db.query(
            `SELECT e.id, e.nombre, e.apellido, e.nivel,
                    ROUND(AVG(n.nota), 2) AS promedio
             FROM estudiantes e
             JOIN notas n ON n.estudiante_id = e.id
             GROUP BY e.id
             HAVING promedio < 70
             ORDER BY promedio ASC`
        );

        res.json({ asistenciaPorCurso, rendimientoPorCurso, bajoRendimiento });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar los reportes' });
    }
};

module.exports = { getReportes };
