import axios from 'axios';

// Instancia central de Axios para todo el frontend.
// Bitácora 08: servicio de API centralizado con manejo automático del token JWT
// y de las sesiones expiradas. Todas las vistas consumen el backend a través de
// esta instancia (nunca con axios.create o axios.get directos).
const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor de solicitud: lee el token del localStorage y lo adjunta
// automáticamente en cada petición como Authorization: Bearer <token>.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de respuesta: ante un 401 (token expirado o inválido) limpia el
// localStorage y redirige al login.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
