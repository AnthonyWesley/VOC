import { EventType } from "../types/dashboard.types";

export const eventTypeLabel = (type: string): string => {
  const labels: Record<EventType | string, string> = {
    HOUSE_SERVICE: "Culto em Casa",
    SUNDAY_SERVICE: "Culto de Domingo",
    PRAYER_MEETING: "Oração",
    BIBLE_STUDY: "Estudo Bíblico",
    YOUTH_NIGHT: "Encontro de Jovens",
    SPECIAL_EVENT: "Evento Especial",
  };
  return labels[type] ?? type;
};
