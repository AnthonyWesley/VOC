import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import churchApi from "../../api/axios";
import Spin from "../../components/Spin";
import MemberForm from "../../member/components/MemberForm";

interface Props {
  children: React.ReactNode;
}

export default function RequireMemberProfile({ children }: Props) {
  const navigate = useNavigate();
  const { authUser, isPending, refetch } = useAuthStatus();
  const [saving, setSaving] = useState(false);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (authUser && !authUser.memberId && !authUser.isTemporaryPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900 px-4">
        <div className="w-full max-w-2xl">
          <MemberForm
            hideHeader
            savePending={saving}
            onSave={async (payload) => {
              setSaving(true);
              try {
                await churchApi.patch("/members/me/complete-profile", payload);
                toast.success("Perfil completo com sucesso!");
                await refetch();
                navigate("/", { replace: true });
              } catch (err: any) {
                toast.error(err?.response?.data?.message || "Erro ao salvar perfil");
              } finally {
                setSaving(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
