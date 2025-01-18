import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMyProfile } from "../hooks/useMyProfile";
import { Role } from "../types/user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const isAuth = useAuth();
  const profile = useMyProfile();

  if (!isAuth) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role as Role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};