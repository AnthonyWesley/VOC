import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import AssignMemberForm from "../../ministry/components/AssignMemberForm";
import { LEVEL } from "../../shared/constants/levels";

type EventMembersListProps = {
  removeMember: {
    mutate: (data: { memberId: string; eventId: string }) => void;
    isPending: boolean;
  };
  eventId: string;
  members: any[];
  readOnly?: boolean;
};

export default function EventMembersList({
  members,
  eventId,
  removeMember,
  readOnly = false,
}: EventMembersListProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 p-5 shadow-sm backdrop-blur-md">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Lista de presença
        </h2>

        {!readOnly && (
          <Modal
            id="assignMemberToEventModal"
            icon="ic:baseline-plus"
            info="Adicionar membro"
            scale={1}
            minLevel={LEVEL.MINISTRY_LEADER}
          >
            <AssignMemberForm targetId={eventId} where="event" />
          </Modal>
        )}
      </div>

      {/* LISTA */}
      {members.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Nenhum participante registrado.
        </p>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => {
            const joined = new Date(m.joinedAt).toLocaleDateString("pt-BR");

            return (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/5"
              >
                {/* LEFT */}
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {m.fullName}
                  </p>
                  <p className="text-xs text-gray-400">Entrada: {joined}</p>
                </div>

                {/* REMOVE */}
                {!readOnly && (
                  <button
                    onClick={() =>
                      removeMember.mutate({
                        memberId: m.id,
                        eventId,
                      })
                    }
                    disabled={removeMember.isPending}
                    className="rounded-lg p-2 text-red-400 transition-all hover:bg-white/5 hover:text-red-300"
                    title="Remover membro"
                  >
                    <Icon icon="line-md:remove" scale={1} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
