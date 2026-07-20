import { FormInput } from "../../components/FormInput";
import { EventType } from "../types/eventTypes";

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  HOUSE_SERVICE: "House",
  SUNDAY_SERVICE: "Culto de Domingo",
  PRAYER_MEETING: "Reunião de Oração",
  BIBLE_STUDY: "Estudo Bíblico",
  YOUTH_NIGHT: "Noite da Juventude",
  SPECIAL_EVENT: "Evento Especial",
};

type Props = {
  formValues: any;
  setFormValues: React.Dispatch<React.SetStateAction<any>>;
  readOnly?: boolean;
};

export default function EventBasicInfo({ formValues, setFormValues, readOnly = false }: Props) {
  const handleChange = (field: string, value: any) => {
    setFormValues((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Informações</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        {/* Título */}
        <FormInput
          label="Título"
          icon="mdi:format-title"
          type="text"
          placeholder="Título do evento"
          value={formValues.title}
          onChange={(e) => handleChange("title", e.target.value)}
          disabled={readOnly}
        />

        {/* Tipo */}
        <FormInput
          label="Tipo"
          icon="mdi:shape-outline"
          type="select"
          value={formValues.type}
          onChange={(e) => handleChange("type", e.target.value)}
          options={Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
          disabled={readOnly}
        />

        {/* Início */}
        <FormInput
          label="Início"
          icon="mdi:clock-start"
          type="datetime-local"
          value={formValues.startsAt}
          onChange={(e) => handleChange("startsAt", e.target.value)}
          disabled={readOnly}
        />

        {/* Fim */}
        <FormInput
          label="Fim"
          icon="mdi:clock-end"
          type="datetime-local"
          value={formValues.endsAt}
          onChange={(e) => handleChange("endsAt", e.target.value)}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
