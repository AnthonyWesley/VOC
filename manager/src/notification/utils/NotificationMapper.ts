import { NotificationDTO } from "../types/NotificationDTO";
import { NotificationUIModel } from "../types/NotificationUIModel";

const DEFAULT_ICON = "bell";
const DEFAULT_COLOR = "gray";

type Presentation = {
  icon: string;
  color: string;
  defaultTitle: string;
  defaultDescription: string;
};

const presentation: Record<string, Presentation> = {
  EVENTO_CRIADO: { icon: "calendar-add", color: "cyan", defaultTitle: "Novo evento", defaultDescription: "Evento criado." },
  MEMBRO_ESCALADO: { icon: "user-check", color: "green", defaultTitle: "Você foi escalado!", defaultDescription: "Você foi escalado para um evento." },
  MEMBER_AUSENTE: { icon: "user-minus", color: "red", defaultTitle: "Membro ausente", defaultDescription: "Um membro está ausente." },
  MEMBRO_REMOVIDO: { icon: "user-x", color: "red", defaultTitle: "Removido da escala", defaultDescription: "Você foi removido da escala de um evento." },
  MEMBRO_VINCULADO: { icon: "account-check", color: "green", defaultTitle: "Bem-vindo à igreja!", defaultDescription: "Seu cadastro como membro foi concluído." },
};

export function mapNotificationToUI(dto: NotificationDTO): NotificationUIModel {
  const p = presentation[dto.type] ?? { icon: DEFAULT_ICON, color: DEFAULT_COLOR, defaultTitle: "Notificação", defaultDescription: "" };

  return {
    id: dto.id,
    title: dto.title || p.defaultTitle,
    description: dto.message || p.defaultDescription,
    icon: p.icon,
    color: p.color,
    createdAt: new Date(dto.createdAt),
    readAt: dto.readAt ? new Date(dto.readAt) : null,
    raw: dto,
  };
}
