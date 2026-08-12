import { RouteObject } from "react-router-dom";
import AuthPage from "../auth/pages/AuthPage";
import ResetPasswordPage from "../auth/pages/ResetPasswordPage";

export const publicRoutes: RouteObject[] = [
  { path: "/auth/login", element: <AuthPage /> },
  { path: "/auth/reset-password", element: <ResetPasswordPage /> },
];