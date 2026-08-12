import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Balloon } from "../../components/Balloon";
import { CardActions } from "../../components/CardActions";
import AnimatedTabs from "../../components/AnimatedTabs";
import useEvent from "../hooks/queryEvent";
import { useEventMutations } from "../hooks/useEventMutations";
import { useEventToPostStore } from "../stores/useEventToPostStore";
import { EventType } from "../types/eventTypes";

function getErrorMsg(err: any): string {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (data?.details?.length) {
    return data.details.map((d: any) => `${d.campo || d.path}: ${d.mensagem || d.message}`).join("; ");
  }
  return "Erro inesperado. Tente novamente.";
}

type EventFormState = {
  title: string;
  type: EventType;
  startsAt: string; // iso string
  preacherId?: string;
  theme?: string;
  notes?: string;
};

export default function EventFormPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const { queryEvent } = useEvent(eventId!);
  const { closeEvent } = useEventMutations();
  const { setData } = useEventToPostStore();

  const [form, setForm] = useState<EventFormState>({
    title: "",
    type: "BIBLE_STUDY",
    startsAt: new Date().toISOString().slice(0, 16), // yyyy-mm-ddTHH:mm
    preacherId: "",
    theme: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preenche o form se for edição
  useEffect(() => {
    if (queryEvent.data && eventId) {
      const e = queryEvent.data;
      setForm({
        title: e.title ?? "",
        type: e.type,
        startsAt: new Date(e.startsAt).toISOString().slice(0, 16),
        preacherId: e.preacherId ?? "",
        theme: e.theme ?? "",
        notes: e.notes ?? "",
      });
    }
  }, [queryEvent.data, eventId]);

  const handleChange = (field: keyof EventFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await closeEvent.mutateAsync({
        event: {
          id: eventId,
          title: form.title,
          type: form.type,
          startsAt: new Date(form.startsAt).toISOString(),
          preacherId: form.preacherId || null,
          theme: form.theme || null,
          notes: form.notes || null,
        },
      });

      if (!eventId) {
        setData({
          title: form.title,
          type: form.type,
          startsAt: form.startsAt,
        });
      }

      navigate("/event");
    } catch (err: any) {
      toast.error(getErrorMsg(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    {
      value: "info",
      label: "Informações",
      icon: "mdi:information-outline",
      content: (
        <div className="space-y-6 pt-2">
          <Balloon offset={40}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Evento</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
              <input
                className="rounded bg-gray-800 p-2 text-[var(--text-primary)]"
                placeholder="Título do evento"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
              <select
                className="rounded bg-gray-800 p-2 text-[var(--text-primary)]"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                <option value="WORSHIP">Culto</option>
                <option value="BIBLE_STUDY">Estudo Bíblico</option>
                <option value="MEETING">Reunião</option>
              </select>
              <input
                type="datetime-local"
                className="rounded bg-gray-800 p-2 text-[var(--text-primary)]"
                value={form.startsAt}
                onChange={(e) => handleChange("startsAt", e.target.value)}
              />
              <input
                placeholder="Tema"
                className="rounded bg-gray-800 p-2 text-[var(--text-primary)]"
                value={form.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
              />
              <textarea
                placeholder="Notas"
                className="rounded bg-gray-800 p-2 text-[var(--text-primary)]"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>
          </Balloon>
        </div>
      ),
    },
    {
      value: "attendance",
      label: "Presença",
      icon: "mdi:account-group-outline",
      content: (
        <div className="space-y-6 pt-2">
          <Balloon offset={40}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Presença</h2>
            <p className="text-sm text-gray-400">
              Adicione informações de membros e visitantes após o evento.
            </p>
          </Balloon>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2 overflow-x-hidden px-4 md:px-6">
      <div className="px-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {eventId ? "Editar Evento" : "Novo Evento"}
        </h1>
        <p
          className="cursor-pointer text-gray-400 transition-colors hover:text-[var(--text-primary)]"
          onClick={() => navigate(-1)}
        >
          ← Voltar para eventos
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-2">
        <AnimatedTabs tabs={tabs} initialValue="info" />
      </div>

      <div className="mx-auto mt-6 max-w-3xl px-4">
        <CardActions
          direction="horizontal"
          actions={[
            {
              icon: "mdi:content-save",
              info: isSubmitting ? "Salvando..." : "Salvar evento",
              onClick: handleSubmit,
              scale: 0.8,
              // disabled: isSubmitting,
            },
          ]}
        />
      </div>
    </div>
  );
}
