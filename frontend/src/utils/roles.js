// Mapa de roles del sistema. Los IDs corresponden a la tabla `roles` del backend.
export const ROLES = [
    { id: 1, nombre: 'administrador' },
    { id: 2, nombre: 'docente' },
    { id: 3, nombre: 'padre' },
];

export const rolNombre = (rolId) =>
    ROLES.find((r) => r.id === Number(rolId))?.nombre || 'desconocido';
