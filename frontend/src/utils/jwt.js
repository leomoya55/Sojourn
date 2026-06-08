// Decodifica el payload de un JWT sin librerías externas.
// Permite restaurar la sesión (rol, nombre) al recargar la página.
export function decodeToken(token) {
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
        return null;
    }
}

// Indica si el token ya expiró según el campo `exp` (en segundos).
export function isTokenExpired(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
}

// Ruta de inicio según el rol del usuario autenticado.
export function homePathForRole(rol) {
    switch (rol) {
        case 'administrador':
            return '/admin';
        case 'docente':
            return '/docente';
        case 'padre':
            return '/padre';
        default:
            return '/';
    }
}
