import { format } from "date-fns";

export const formatDate = (date?: string | null) => {
  if (!date || isNaN(Date.parse(date))) return "Data inválida";
  return format(new Date(date), "HH:mm - dd/MM/yyyy");
};
