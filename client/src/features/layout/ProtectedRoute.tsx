import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../auth/AuthProvider';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
