import { useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth";

// Types
// types/auth.ts

export interface User {
  userId: string;
  memberId: string | null;
  email: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  isTemporaryPassword?: boolean;
  status: string;
  roles: { name: string; level: number }[];
  fullName: string | null;
  phone: string | null;
  birthDate: Date | null;
  baptismDate: Date | null;
  churchJoinDate: Date | null;
  ministries: { id: string; name: string; joinedAt: Date }[];
  ledMinistries: { id: string; name: string }[];
  createdAt: Date;
}

export default function useAuthStatus() {
  const isPublicPage =
    window.location.pathname === "/" ||
    window.location.pathname.startsWith("/auth/") ||
    window.location.pathname.startsWith("/post/");

  const { data, isLoading, isFetched, isPending, refetch } = useQuery<User>({
    queryKey: ["userData"],
    queryFn: () => authService.findOne(),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !isPublicPage,
  });

  return {
    isAuthenticated: !!data,
    authUser: data,
    authUserId: data?.userId,
    authLevel: data?.roles?.length ? Math.max(...data.roles.map(r => r.level)) : 0,
    isLoading,
    isFetched,
    isPending,
    refetch,
    data,
  };
}
