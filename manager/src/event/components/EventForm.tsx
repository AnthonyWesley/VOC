import { useEffect, useState } from "react";
import { useEventMutations } from "../hooks/useEventMutations";
import { EventType } from "../types/eventTypes";

const typeLabels: Record<EventType, string> = {
  SUNDAY_SERVICE: "Culto de Domingo",
  HOUSE_SERVICE: "Culto no Lar",
  PRAYER_MEETING: "Reuniao de Oracao",
  BIBLE_STUDY: "Estudo Biblico",
  YOUTH_NIGHT: "Noite da Juventude",
  SPECIAL_EVENT: "Evento Especial",
};

type EventFormProps = {
  event?: {
    id: string;
    title?: string | null;
    type: EventType;
    startsAt: string;
  };
};

export default function EventForm({ event }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("SUNDAY_SERVICE");
  const [startsAt, setStartsAt] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const { closeEvent } = useEventMutations();

  useEffect(() => {
    if (!event) return;

    setType(event.type);
    setStartsAt(event.startsAt.slice(0, 16));

    if (event.title) {
      setTitle(event.title);
      setTitleEdited(true);
    } else {
      setTitle(typeLabels[event.type]);
    }
  }, [event]);

  useEffect(() => {
    if (!titleEdited) {
      setTitle(typeLabels[type]);
    }
  }, [type, titleEdited]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    closeEvent.mutate({
      event: {
        id: event?.id,
        title,
        type,
        startsAt: new Date(startsAt).toISOString(),
      },
    });
  };

  return (
    <div className="card bg-base-200 mx-auto max-w-xl p-6 shadow-xl">
      <h1 className="mb-4 text-2xl font-bold">
        {event ? "Editar Evento" : "Novo Evento"}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Titulo</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleEdited(true);
            }}
            placeholder="Titulo do evento"
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Tipo de Evento</span>
          </label>
          <select
            className="select select-bordered"
            value={type}
            onChange={(e) => {
              setType(e.target.value as EventType);
              setTitleEdited(false);
            }}
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Data e Hora</span>
          </label>
          <input
            type="datetime-local"
            className="input input-bordered"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary mt-4" type="submit">
          Salvar
        </button>
      </form>
    </div>
  );
}
