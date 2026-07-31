import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // El backend ya rechaza a los no-admin; esto evita ademas que un usuario
  // normal vea la interfaz y dispare llamadas que van a fallar con 403.
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace state={{ error: 'forbidden' }} />;
  }

  return <Outlet />;
};
