import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import AssignMemberForm from "../../ministry/components/AssignMemberForm";
import useMinistries from "../../ministry/hooks/useMinistries";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { LEVEL } from "../../shared/constants/levels";
type EventAssignmentsTabProps = {
  assignments: any[];
  eventId: string;
  removeMember: {
    mutate: (data: {
      memberId: string;
      eventId: string;
      assignmentId: string;
    }) => void;
    isPending: boolean;
  };
  readOnly?: boolean;
};

export default function EventAssignmentsTab({
  assignments,
  eventId,
  removeMember,
  readOnly = false,
}: EventAssignmentsTabProps) {
  const { authUser, authLevel } = useAuthStatus();
  const {
    queryMinistries: { data: ministries, isLoading, error },
  } = useMinistries();

  if (isLoading)
    return <p className="text-gray-300">Carregando ministérios...</p>;
  if (error)
    return <p className="text-red-400">Erro ao carregar ministérios.</p>;

  const ledIds = new Set(authUser?.ledMinistries?.map((m) => m.id) ?? []);

  // Agrupa assignments por ministryId
  const assignmentsByMinistry = assignments.reduce((acc: any, a: any) => {
    if (!acc[a.ministry.id]) acc[a.ministry.id] = [];
    acc[a.ministry.id].push(a);
    return acc;
  }, {});

  return (
    <div className="scrollbar-thin flex min-h-[60vh] gap-6 overflow-x-auto pt-2 pb-4">
      {ministries?.map((ministry) => {
        const ministryAssignments = assignmentsByMinistry[ministry.id] ?? [];
        const canManage = !readOnly && (ledIds.has(ministry.id) || authLevel >= 80);

        return (
          <div
            key={ministry.id}
            className="card-premium w-[300px] shrink-0 p-4"
          >
            {/* HEADER DO CARD */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {ministry.name}
              </h2>

              {canManage && (
                <Modal
                  id={`assignAssignmentToEventModal-${ministry.id}`}
                  icon="ic:baseline-plus"
                  info="Adicionar designação"
                  scale={1}
                  minLevel={LEVEL.MINISTRY_LEADER}
                >
                  <AssignMemberForm
                    targetId={eventId}
                    where="assignment"
                    ministryId={ministry.id}
                  />
                </Modal>
              )}
            </div>

            {/* LISTA DE ASSIGNMENTS */}
            {ministryAssignments.length === 0 ? (
              <p className="text-gray-400 italic">
                Nenhum membro escalado para este ministério.
              </p>
            ) : (
              <ul className="space-y-3">
                {ministryAssignments.map((a: any) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between border-b border-b-gray-500/15 px-4"
                  >
                    {/* LEFT */}
                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)] italic">
                        {a.member.fullName}
                      </p>

                      {a.description && (
                        <p className="text-xs text-gray-400">{a.description}</p>
                      )}
                    </div>

                    {/* REMOVE */}
                    {canManage && (
                      <button
                        onClick={() =>
                          removeMember.mutate({
                            memberId: a.member.id,
                            eventId,
                            assignmentId: a.id,
                          })
                        }
                        disabled={removeMember.isPending}
                        className="rounded-lg p-2 text-red-400 transition-all hover:bg-white/5 hover:text-red-300"
                        title="Remover membro da escala"
                      >
                        <Icon icon="line-md:remove" scale={0.5} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
