import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { FormValidator } from "../../helpers/FormValidator";
import { useUserMutations } from "../hooks/useUserMutations";
import CopyToClipboard from "../../components/CopyToClipboard";
import { FormInput } from "../../components/FormInput";
import { PageHeader } from "../../components/PageHeader";
import { FormButton } from "../../components/FormButton";

type UserFormProps = {
  user?: any; // ideal: tipar corretamente depois
};

export default function UserForm({ user }: UserFormProps) {
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const { createUser, updateUser } = useUserMutations();

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
  }, [user]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isValid = FormValidator.validateAll({ email });
    if (!isValid) return;

    const payload = { email };

    if (!user) {
      createUser.mutate(payload, {
        onSuccess: (response) => {
          setTemporaryPassword(response.temporaryPassword);
        },
      });
    } else {
      updateUser.mutate({
        userId: user.userId,
        data: payload,
      });
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      {/* 🔥 Header reutilizável */}
      <PageHeader
        icon={user ? "mdi:account-edit" : "mdi:account-plus"}
        title={user ? "Editar Usuário" : "Novo Usuário"}
        subtitle="Gerenciamento de contas e permissões"
      />

      {!temporaryPassword ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <FormInput
            label="Email"
            icon="mdi:email-outline"
            type="text"
            placeholder="Digite o email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormButton
            label="Salvar"
            icon="mdi:content-save"
            type="submit"
            isPending={createUser.isPending || updateUser.isPending}
            // disabled={!hasChanges}
          />
        </form>
      ) : (
        <div className="flex h-47 items-center justify-center gap-2 p-6 text-[var(--text-primary)]">
          <p>Senha temporária:</p>
          <CopyToClipboard text={temporaryPassword} label={temporaryPassword} />
        </div>
      )}
    </Card>
  );
}
