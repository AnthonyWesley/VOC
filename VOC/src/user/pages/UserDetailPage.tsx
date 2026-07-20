import { Icon } from "@iconify/react";
import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { CardActions } from "../../components/CardActions";
import { calculateAge } from "../../helpers/calculateAge";
import useUser from "../hooks/useUser";
import { useUserMutations } from "../hooks/useUserMutations";
import { Balloon } from "../../components/Balloon";
import { UserRolesManager } from "../components/UserRolesManager";
import { PageHeader } from "../../components/PageHeader";
import Dialog from "../../components/Dialog";

export default function UserDetailPage() {
  const { userId } = useParams();
  const {
    queryUser: { data: user, isLoading, error },
  } = useUser(userId!);

  const { activeUser, deactivateUser, adminResetPassword } = useUserMutations();
  const [resetResult, setResetResult] = useState<{
    temporaryPassword: string;
    phone: string | null;
    whatsappSent: boolean;
  } | null>(null);

  const handleConfirmReset = useCallback(async () => {
    try {
      const result = await adminResetPassword.mutateAsync(userId!);
      setResetResult(result);
    } catch {
      /* erro tratado pelo onError da mutation */
    }
  }, [userId, adminResetPassword]);

  if (isLoading) return <p className="text-gray-300">Carregando usuário...</p>;
  if (error || !user)
    return <p className="text-red-400">Usuário não encontrado.</p>;

  const age = calculateAge(user.birthDate);
  const baptism = user.baptismDate
    ? new Date(user.baptismDate).toLocaleDateString("pt-BR")
    : "-";

  const birth = user.birthDate
    ? new Date(user.birthDate).toLocaleDateString("pt-BR")
    : "-";

  const created = new Date(user.createdAt).toLocaleDateString("pt-BR");

  return (
    <div className="space-y-6 px-4 md:px-6">
      <PageHeader
        icon="mdi:account"
        title={user.fullName ?? "Usuário"}
        subtitle="Detalhes completos do usuário"
        back
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
      />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="group card-hover card-premium relative flex items-center gap-6 p-6">
          <Avatar
            image={user.photoUrl ?? ""}
            name={user.fullName ?? ""}
            size="96"
            className="size-24 rounded-full bg-gray-800 outline-1 -outline-offset-1 outline-white/10"
          />

          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {user.fullName}
            </h1>
            <p className="text-gray-400">{user.email}</p>

            <div className="mt-3 flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {user.isActive ? (
                  <>
                    <div className="rounded-full bg-emerald-500/30 p-1">
                      <div className="size-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <span className="text-sm text-emerald-400">Ativo</span>
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-red-500/30 p-1">
                      <div className="size-2 rounded-full bg-red-500"></div>
                    </div>
                    <span className="text-sm text-red-400">Inativo</span>
                  </>
                )}
              </div>

              <CardActions
                direction="horizontal"
                fixed
                actions={[
                  {
                    icon: "mdi:account-edit",
                    info: "Editar usuário",
                    onClick: () => {},
                    scale: 1,
                  },
                  {
                    icon: "mdi:key-variant",
                    info: "Redefinir senha",
                    modalId: "ResetPasswordConfirm",
                    scale: 1,
                    content: (
                      <Dialog
                        id="ResetPasswordConfirm"
                        message="Tem certeza que deseja redefinir a senha deste usuário? Ele receberá uma nova senha temporária via WhatsApp."
                        onClick={handleConfirmReset}
                        disabled={adminResetPassword.isPending}
                      />
                    ),
                  },
                  {
                    icon: user.isActive
                      ? "mdi:account-cancel"
                      : "mdi:account-check",
                    info: user.isActive
                      ? "Desativar usuário"
                      : "Ativar usuário",
                    onClick: () =>
                      user.isActive
                        ? deactivateUser.mutate(user.userId)
                        : activeUser.mutate(user.userId),
                    scale: 1,
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <UserRolesManager roles={user.roles} userId={user.userId} />

        <Balloon className="mt-8" offset={40}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Ministérios
          </h2>

          {user.ministries.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              Nenhum ministério associado.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {user.ministries.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full bg-indigo-600/30 px-3 py-1 text-xs text-indigo-300"
                >
                  {m.name}
                </span>
              ))}
            </div>
          )}
        </Balloon>

        <Balloon className="mt-8" offset={"85%"}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Informacoes pessoais
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Telefone</p>
              <div className="flex items-center gap-1">
                <p className="text-[var(--text-primary)]">
                  {user.phone ?? "-"}
                </p>
                {user.phone && (
                  <a
                    href={`https://wa.me/${user.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon
                      icon="mdi:whatsapp"
                      className="text-emerald-400 hover:text-emerald-300"
                      width={16}
                    />
                  </a>
                )}
              </div>
            </div>

            <div>
              <p className="text-gray-400">Idade</p>
              <p className="text-[var(--text-primary)]">{age ?? "-"}</p>
            </div>

            <div>
              <p className="text-gray-400">Nascimento</p>
              <p className="text-[var(--text-primary)]">{birth}</p>
            </div>

            <div>
              <p className="text-gray-400">Batismo</p>
              <p className="text-[var(--text-primary)]">{baptism}</p>
            </div>

            <div>
              <p className="text-gray-400">Membro ID</p>
              <p className="text-[var(--text-primary)]">
                {user.memberId?.slice(0, 7) ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Criado em</p>
              <p className="text-[var(--text-primary)]">{created}</p>
            </div>
          </div>
        </Balloon>

        {/* <UserRolesManager roles={user.roles} userId={user.userId} /> */}
      </div>

      {/* Modal de senha redefinida */}
      <dialog
        open={!!resetResult}
        onClose={() => setResetResult(null)}
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box bg-gray-900 text-gray-200">
          <h3 className="text-lg font-bold text-white">Senha redefinida</h3>
          <p className="py-2 text-sm text-gray-400">
            A nova senha temporária do usuário é:
          </p>

          <div className="rounded-lg bg-gray-800 p-4 text-center">
            <p className="font-mono text-2xl font-bold text-emerald-400">
              {resetResult?.temporaryPassword}
            </p>
          </div>

          {resetResult?.phone && resetResult.whatsappSent && (
            <p className="mt-3 text-xs text-gray-500">
              Uma mensagem com a senha foi enviada via WhatsApp para o telefone
              do usuário.
            </p>
          )}
          {resetResult?.phone && !resetResult.whatsappSent && (
            <p className="mt-3 flex items-center gap-1 text-xs text-amber-400">
              <Icon icon="mdi:alert-outline" width={14} />
              Não foi possível enviar a mensagem via WhatsApp. Verifique se a
              instância do WhatsApp está conectada na página do WhatsApp.
            </p>
          )}

          <div className="modal-action">
            <button
              onClick={() => setResetResult(null)}
              className="btn btn-sm bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Fechar
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
