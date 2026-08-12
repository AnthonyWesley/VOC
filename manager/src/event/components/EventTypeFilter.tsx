import { FormInput } from "../../components/FormInput";
import { EventType } from "../types/eventTypes";

interface Props {
  value?: EventType;
  onChange: (value?: EventType) => void;
}

export function EventTypeFilter({ value, onChange }: Props) {
  return (
    <FormInput
      label="Tipo"
      icon="mdi:filter-outline"
      type="select"
      value={value ?? "all"}
      onChange={(e) =>
        onChange(
          e.target.value === "all" ? undefined : (e.target.value as EventType),
        )
      }
      options={[
        { label: "Todos", value: "all" },
        { label: "Culto Domingo", value: "SUNDAY_SERVICE" },
        { label: "Reunião de Oração", value: "PRAYER_MEETING" },
        { label: "Estudo Bíblico", value: "BIBLE_STUDY" },
        { label: "Noite Jovem", value: "YOUTH_NIGHT" },
        { label: "Evento Especial", value: "SPECIAL_EVENT" },
      ]}
      variant="full"
      className="min-w-[200px]"
    />
  );
}
