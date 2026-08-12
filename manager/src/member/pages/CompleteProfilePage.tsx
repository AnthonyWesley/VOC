import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import churchApi from "../../api/axios";
import { toast } from "react-toastify";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import Spin from "../../components/Spin";

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { authUser, isPending, refetch } = useAuthStatus();

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  if (isPending) return <Spin />;

  if (authUser?.memberId) {
    navigate("/post", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !birthDate) {
      toast.error("Nome e data de nascimento são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      await churchApi.patch("/members/me/complete-profile", {
        fullName,
        nickname: nickname || undefined,
        birthDate: new Date(birthDate),
        phone: phone || undefined,
        postcode: postcode || undefined,
        address: address || undefined,
      });
      toast.success("Perfil completo com sucesso!");
      await refetch();
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <PageHeader
          icon="mdi:account-plus"
          title="Completar Cadastro"
          subtitle="Preencha seus dados para começar a usar o sistema"
          className="border-none bg-none px-0 py-0"
        />

        <form onSubmit={handleSubmit} className="card-premium space-y-4 p-6">
          <FormInput
            label="Nome completo *"
            icon="mdi:account"
            type="text"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <FormInput
            label="Apelido"
            icon="mdi:account-star"
            type="text"
            placeholder="Como gosta de ser chamado"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          <FormInput
            label="Data de nascimento *"
            icon="mdi:calendar"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />

          <FormInput
            label="Telefone"
            icon="mdi:phone"
            type="text"
            placeholder="(55) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <FormInput
            label="CEP"
            icon="mdi:map-marker"
            type="text"
            placeholder="CEP"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
          />

          <FormInput
            label="Endereço"
            icon="mdi:home"
            type="text"
            placeholder="Rua, número, bairro"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <FormButton
            label="Salvar e começar"
            icon="mdi:check"
            type="submit"
            isPending={saving}
          />
        </form>
      </div>
    </div>
  );
}
