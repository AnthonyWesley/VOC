import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStatus from "../../auth/hooks/useAuthStatus";

import AnimatedTabs from "../../components/AnimatedTabs";
import useEvent from "../hooks/queryEvent";
import { useEventMutations } from "../hooks/useEventMutations";

import EventFinanceTab from "../components/EventFinanceTab";
import EventInfoTab from "../components/EventInfoTab";
import EventAssignmentsTab from "../components/EventAssignmentsTab";
import EventReportTab from "../components/EventReportTab";

import { CloseEventInput, EventType } from "../types/eventTypes";
import { PageHeader } from "../../components/PageHeader";
import { FormButton } from "../../components/FormButton";

function getErrorMsg(err: any): string {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (data?.details?.length) {
    return data.details
      .map((d: any) => `${d.campo || d.path}: ${d.mensagem || d.message}`)
      .join("; ");
  }
  return "Erro inesperado. Tente novamente.";
}

type FormValues = {
  id?: string;
  title: string | null;
  type: EventType;
  startsAt: string;
  endsAt: string | null;
  attendanceMode: string;
  theme: string | null;
  notes: string | null;

  preacher: {
    id: string;
    fullName: string;
    email?: string;
    photoUrl?: string;
  } | null;

  members: Array<{
    id: string;
    fullName: string;
    photoUrl?: string;
  }>;

  assignments: Array<{
    id: string;
    member: {
      id: string;
      fullName: string;
      photoUrl?: string;
    };
    ministry: {
      id: string;
      name: string;
    };
    description: string | null;
    assignedAt: string;
  }>;

  attendance: {
    membersCount: number;
    visitorsCount: number;
  } | null;
};

function getInitialValues(): FormValues {
  return {
    id: undefined,
    title: "",
    type: "SUNDAY_SERVICE",
    startsAt: "",
    endsAt: "",
    preacher: null,
    theme: "",
    notes: "",
    attendance: {
      membersCount: 0,
      visitorsCount: 0,
    },
    assignments: [],
    members: [],
    attendanceMode: "INDIVIDUAL",
  };
}

export default function EventDetailPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { authLevel, authUserId } = useAuthStatus();

  const isEditMode = Boolean(eventId);

  const { queryEvent } = useEvent(eventId);
  const { removeMember, closeEvent } = useEventMutations();

  const [formValues, setFormValues] = useState<FormValues>(getInitialValues());
  const [loading, setLoading] = useState(false);

  const isCreator = queryEvent.data?.createdById === authUserId;
  const readOnly = isEditMode && !isCreator && authLevel < 80;

  // Populate form
  useEffect(() => {
    if (isEditMode && queryEvent.data) {
      const e = queryEvent.data;

      setFormValues({
        id: e.id,
        title: e.title ?? "",
        type: e.type ?? "SUNDAY_SERVICE",

        startsAt: e.startsAt
          ? new Date(e.startsAt).toISOString().slice(0, 16)
          : "",

        endsAt: e.endsAt ? new Date(e.endsAt).toISOString().slice(0, 16) : "",

        preacher: e.preacher ?? null,
        theme: e.theme ?? "",
        notes: e.notes ?? "",

        attendance: {
          membersCount: e.attendance?.membersCount ?? 0,
          visitorsCount: e.attendance?.visitorsCount ?? 0,
        },

        assignments:
          e.assignments?.map((a) => ({
            ...a,
            assignedAt: new Date(a.assignedAt).toISOString().slice(0, 16),
          })) ?? [],

        members: e.members ?? [],
        attendanceMode: "INDIVIDUAL",
      });
    }
  }, [isEditMode, queryEvent.data]);

  if (isEditMode && queryEvent.error) {
    return <p className="text-red-400">Evento não encontrado.</p>;
  }

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formValues.title || !formValues.startsAt) {
        throw new Error("Dados obrigatórios não preenchidos");
      }

      const payload: CloseEventInput = {
        event: {
          id: eventId ?? undefined,
          title: formValues.title,
          type: formValues.type,
          startsAt: new Date(formValues.startsAt).toISOString(),
          endsAt: formValues.endsAt
            ? new Date(formValues.endsAt).toISOString()
            : null,
          preacherId: formValues.preacher?.id ?? null,
          theme: formValues.theme || null,
          notes: formValues.notes || null,
        },
        attendance: {
          membersCount: formValues.attendance?.membersCount ?? 0,
          visitorsCount: formValues.attendance?.visitorsCount ?? 0,
        },
      };

      const result = await closeEvent.mutateAsync(payload);

      if (authLevel >= 80) {
        navigate("/event");
      } else {
        navigate(`/event/${result.id ?? eventId}`);
      }
    } catch (err: any) {
      toast.error(getErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      value: "info",
      label: "Detalhes",
      icon: "mdi:information-outline",
      content: (
        <>
          <EventInfoTab
            formValues={formValues}
            setFormValues={setFormValues}
            eventId={eventId!}
            removeMember={removeMember}
            readOnly={readOnly}
          />
          {authLevel >= 40 && !readOnly && (
            <FormButton
              label={
                loading
                  ? "Salvando..."
                  : isEditMode
                    ? "Atualizar evento"
                    : "Criar evento"
              }
              icon={
                loading ? "line-md:loading-twotone-loop" : "mdi:content-save"
              }
              isPending={loading}
              onClick={handleSave}
              width="full"
              variant="success"
              className="mt-6"
            />
          )}
        </>
      ),
    },

    ...(eventId
      ? [
          {
            value: "assignments",
            label: "Escala",
            icon: "mdi:clipboard-list-outline",
            content: (
              <EventAssignmentsTab
                assignments={queryEvent.data?.assignments ?? []}
                eventId={eventId ?? ""}
                removeMember={removeMember}
              />
            ),
          },
        ]
      : []),

    ...(eventId && authLevel >= 80
      ? [
          {
            value: "finance",
            label: "Financeiro",
            icon: "mdi:cash-multiple",
            content: <EventFinanceTab eventId={eventId ?? ""} />,
          },
        ]
      : []),

    ...(eventId && queryEvent.data && authLevel >= 80
      ? [
          {
            value: "report",
            label: "Relatório",
            icon: "mdi:file-document-outline",
            content: (
              <EventReportTab event={queryEvent.data} eventId={eventId ?? ""} />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 px-4 pb-5 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon="mdi:calendar-edit"
        title={
          formValues.title || (isEditMode ? "Editar evento" : "Novo evento")
        }
        subtitle="Gerencie informações, escala e financeiro"
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-2"
      />

      {/* CONTEÚDO CENTRALIZADO */}
      <div className="my-6 flex-1 p-6">
        {/* TABS PREMIUM */}
        <AnimatedTabs tabs={tabs} initialValue="info" />

        {/* BOTÃO SALVAR */}
      </div>
    </div>
  );
}
