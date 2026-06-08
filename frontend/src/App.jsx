import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import DocenteDashboard from './pages/docente/DocenteDashboard';
import PadreDashboard from './pages/padre/PadreDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { homePathForRole } from './utils/jwt';

// Redirige al panel correspondiente según el rol (o al login si no hay sesión).
// Bitácora 04, obj. 3 y 5: administrador → /admin, docente → /docente, padre → /padre.
function RoleRedirect() {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated()) return <Navigate to="/" replace />;
    return <Navigate to={homePathForRole(user.rol)} replace />;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['administrador']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/docente"
                        element={
                            <ProtectedRoute allowedRoles={['docente']}>
                                <DocenteDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/padre"
                        element={
                            <ProtectedRoute allowedRoles={['padre']}>
                                <PadreDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Compatibilidad: /dashboard redirige al panel según rol */}
                    <Route path="/dashboard" element={<RoleRedirect />} />
                    <Route path="*" element={<RoleRedirect />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
