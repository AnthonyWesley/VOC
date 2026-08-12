import { useParams } from "react-router-dom";
import { Balloon } from "../../components/Balloon";
import { CardActions } from "../../components/CardActions";
import useMinistry from "../hooks/useMinistry";
import AssignMemberForm from "../components/AssignMemberForm";
import Modal from "../../components/Modal";
import { useMinistryMutations } from "../hooks/useMemberMutations";
import Icon from "../../components/Icon";
import { PageHeader } from "../../components/PageHeader";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { LEVEL } from "../../shared/constants/levels";

export default function MinistryDetailPage() {
  const { ministryId } = useParams();
  const { removeMember } = useMinistryMutations();
  const { authUser, authLevel } = useAuthStatus();

  const {
    queryMinistry: { data: ministry, isLoading, error },
  } = useMinistry(ministryId!);

  if (isLoading)
    return <p className="text-gray-300">Carregando ministério...</p>;
  if (error || !ministry)
    return <p className="text-red-400">Ministério não encontrado.</p>;

  const created = new Date(ministry.createdAt).toLocaleDateString("pt-BR");
  const canManage = (authUser?.memberId === ministry.leaderId) || authLevel >= 80;

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon="mdi:church"
        title={ministry.name}
        subtitle="Detalhes completos do ministério"
        back
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
      />

      <div className="mx-auto max-w-3xl space-y-8">
        {/* CARD PREMIUM DO MINISTÉRIO */}
        <div className="card-premium rounded-2xl border border-slate-800 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-start justify-between">
            {/* INFO */}
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {ministry.name}
              </h1>
              <p className="mt-1 text-gray-400">
                {ministry.description ?? "Sem descrição"}
              </p>
            </div>

            {/* ADICIONAR MEMBRO */}
            {canManage && (
              <Modal
                id="assignMemberModal"
                className="flex"
                icon="ic:baseline-plus"
                info="Adicionar membro"
                scale={1.2}
              >
                <AssignMemberForm targetId={ministryId!} where="ministry" />
              </Modal>
            )}
          </div>
        </div>

        {/* MEMBROS DO MINISTÉRIO */}
        <Balloon className="mt-4" offset={40}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Membros do ministério
          </h2>

          {ministry.members.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              Nenhum membro associado.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ministry.members.map((m) => {
                const joined = new Date(m.joinedAt).toLocaleDateString("pt-BR");

                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 backdrop-blur-sm"
                  >
                    {/* LEFT */}
                    <div className="flex w-[60%] items-center gap-3">
                      {m.status === "ACTIVE" ? (
                        <div className="rounded-full bg-emerald-500/30 p-1">
                          <div className="size-1.5 rounded-full bg-emerald-500"></div>
                        </div>
                      ) : (
                        <div className="rounded-full bg-red-500/30 p-1">
                          <div className="size-1.5 rounded-full bg-red-500"></div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-[var(--text-primary)]">
                          {m.fullName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Entrada: {joined}
                        </p>
                      </div>
                    </div>

                    {/* REMOVER */}
                    {canManage && (
                      <button
                        className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white/5 hover:text-[var(--text-primary)]"
                        onClick={() =>
                          removeMember.mutate({
                            memberId: m.id,
                            ministryId: ministryId!,
                          })
                        }
                        disabled={removeMember.isPending}
                        title="Remover usuário"
                      >
                        <Icon icon="line-md:remove" scale={0.5} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Balloon>

        {/* INFORMAÇÕES DO MINISTÉRIO */}
        <Balloon className="mt-4" offset={40}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Informações
          </h2>

          <div className="mt-4 text-sm">
            <p className="text-gray-400">Criado em</p>
            <p className="text-[var(--text-primary)]">{created}</p>
          </div>
        </Balloon>

        {/* AÇÕES */}
        <div className="mt-8">
          <CardActions
            direction="horizontal"
            fixed
            actions={[
              {
                icon: "mdi:account-edit",
                info: "Editar ministério",
                modalId: `editMinistryModal-${ministry.id}`,
                scale: 0.8,
                minLevel: LEVEL.PRESIDENT,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
