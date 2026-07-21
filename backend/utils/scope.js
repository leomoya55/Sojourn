// Control de acceso por estudiante.
// El padre solo puede consultar la información (notas, asistencia) de los
// estudiantes asociados a su cuenta (estudiantes.padre_id = su id). El
// administrador y el docente pueden consultar cualquier estudiante.
//
// Devuelve true si el usuario autenticado puede ver a ese estudiante.
const canViewStudent = async (db, user, estudianteId) => {
    if (!user) return false;
    if (user.rol === 'administrador' || user.rol === 'docente') return true;
    if (user.rol === 'padre') {
        const [rows] = await db.query(
            'SELECT 1 FROM estudiantes WHERE id = ? AND padre_id = ? LIMIT 1',
            [estudianteId, user.id]
        );
        return rows.length > 0;
    }
    return false;
};

module.exports = { canViewStudent };
