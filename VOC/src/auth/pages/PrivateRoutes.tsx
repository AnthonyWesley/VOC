import { Outlet, Navigate } from "react-router-dom";

export default function PrivateRoutes() {
  const isAuthenticated = true;

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
}
