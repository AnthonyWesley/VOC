import { RouteObject } from "react-router-dom";
import AuthPage from "../auth/pages/AuthPage";
import ResetPasswordPage from "../auth/pages/ResetPasswordPage";
import HomePage from "../home/pages/HomePage";
import PublicPostPage from "../post/pages/PublicPostPage";
import MemberRegistrationPage from "../member/pages/MemberRegistrationPage";
import { TempAuthProvider } from "../auth/contexts/TempAuthContext";

export const publicRoutes: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: "/auth/login", element: <TempAuthProvider><AuthPage /></TempAuthProvider> },
  { path: "/auth/reset-password", element: <TempAuthProvider><ResetPasswordPage /></TempAuthProvider> },
  { path: "/post/:postId", element: <PublicPostPage /> },
  { path: "/cadastro-membro", element: <MemberRegistrationPage /> },
];
