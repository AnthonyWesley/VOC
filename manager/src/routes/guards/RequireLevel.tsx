// guards/RequireLevel.tsx
import { Navigate } from "react-router-dom";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import Spin from "../../components/Spin";

interface RequireLevelProps {
  minLevel: number;
  children: React.ReactNode;
}

export default function RequireLevel({
  minLevel,
  children,
}: RequireLevelProps) {
  const { authLevel, isPending } = useAuthStatus();
  if (isPending) return <Spin />;

  if (authLevel < minLevel) {
    return <Navigate to="/error/forbidden" replace />;
  }

  return <>{children}</>;
}
