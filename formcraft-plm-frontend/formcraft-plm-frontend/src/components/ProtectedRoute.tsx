import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../types';
import { Layout } from './Layout';

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !hasRole(...roles)) {
    return (
      <Layout>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2>Access denied</h2>
          <p className="text-muted">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}
