export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR");
}

export function formatMonthYear(month: number, year: number): string {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${months[month - 1]} de ${year}`;
}

export function generateDocumentId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    HOUSE_SERVICE: "Culto em Casa",
    SUNDAY_SERVICE: "Culto de Domingo",
    PRAYER_MEETING: "Reunião de Oração",
    BIBLE_STUDY: "Estudo Bíblico",
    YOUTH_NIGHT: "Noite da Juventude",
    SPECIAL_EVENT: "Evento Especial",
  };
  return labels[type] ?? type;
}

export function paymentMethodLabel(method: string): string {
  return method.replace(/_/g, " ");
}
