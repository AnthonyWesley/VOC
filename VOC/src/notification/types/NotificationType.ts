export const NotificationType = {
  MEMBER_AUSENTE: "MEMBER_AUSENTE",
  MEMBRO_VINCULADO: "MEMBRO_VINCULADO",
  MEMBRO_REMOVIDO: "MEMBRO_REMOVIDO",
  EVENTO_CRIADO: "EVENTO_CRIADO",
  ESCALA_PENDENTE: "ESCALA_PENDENTE",
  MEMBRO_ESCALADO: "MEMBRO_ESCALADO",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
