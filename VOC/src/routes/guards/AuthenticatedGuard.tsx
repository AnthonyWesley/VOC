import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import Spin from "../../components/Spin";

export default function AuthenticatedGuard({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading, isFetched } = useAuthStatus();

  if (isLoading && !isFetched) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
