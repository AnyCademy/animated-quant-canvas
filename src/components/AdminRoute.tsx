import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/use-user-role';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, requireSuperAdmin = false }) => {
  const { loading, isAdmin, isSuperAdmin } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-quant-blue-dark flex items-center justify-center">
        <div className="text-quant-white">Loading...</div>
      </div>
    );
  }

  if (requireSuperAdmin && !isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-quant-blue-dark flex items-center justify-center p-4">
        <Alert className="max-w-md bg-red-900 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            Super admin access required. You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-quant-blue-dark flex items-center justify-center p-4">
        <Alert className="max-w-md bg-red-900 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            Admin access required. You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
