import { NotificationDTO } from "../types/NotificationDTO";
import { NotificationUIModel } from "../types/NotificationUIModel";

export function mapNotificationToUI(dto: NotificationDTO): NotificationUIModel {
  switch (dto.type) {
    case "EVENTO_CRIADO": {
      const p: Record<string, string> = JSON.parse(dto.payload);
      return {
        id: dto.id,
        title: p.title ?? "Novo evento",
        description: p.message ?? "Evento criado.",
        icon: "calendar-add",
        color: "cyan",
        createdAt: new Date(dto.createdAt),
        readAt: dto.readAt ? new Date(dto.readAt) : null,
        raw: dto,
      };
    }

    case "ESCALA_PENDENTE": {
      const p2: Record<string, string> = JSON.parse(dto.payload);
      return {
        id: dto.id,
        title: p2.title ?? "Escala pendente",
        description: p2.message ?? "Um evento precisa de escala.",
        icon: "clipboard-alert",
        color: "yellow",
        createdAt: new Date(dto.createdAt),
        readAt: dto.readAt ? new Date(dto.readAt) : null,
        raw: dto,
      };
    }

    case "MEMBRO_ESCALADO": {
      const p3: Record<string, string> = JSON.parse(dto.payload);
      return {
        id: dto.id,
        title: p3.title ?? "Você foi escalado!",
        description: p3.message ?? "Você foi escalado para um evento.",
        icon: "user-check",
        color: "green",
        createdAt: new Date(dto.createdAt),
        readAt: dto.readAt ? new Date(dto.readAt) : null,
        raw: dto,
      };
    }

    case "MEMBER_AUSENTE": {
      const p4: Record<string, string> = JSON.parse(dto.payload);
      return {
        id: dto.id,
        title: p4.title ?? "Membro ausente",
        description: p4.message ?? "Um membro está ausente.",
        icon: "user-minus",
        color: "red",
        createdAt: new Date(dto.createdAt),
        readAt: dto.readAt ? new Date(dto.readAt) : null,
        raw: dto,
      };
    }

    case "MEMBRO_REMOVIDO": {
      const p5: Record<string, string> = JSON.parse(dto.payload);
      return {
        id: dto.id,
        title: p5.title ?? "Removido da escala",
        description: p5.message ?? "Você foi removido da escala de um evento.",
        icon: "user-x",
        color: "red",
        createdAt: new Date(dto.createdAt),
        readAt: dto.readAt ? new Date(dto.readAt) : null,
        raw: dto,
      };
    }

    case "MEMBRO_VINCULADO": {
      const p6: Record<string, string> = JSON.parse(dto.payload);
      return {
        id: dto.id,
        title: p6.title ?? "Bem-vindo à igreja!",
        description: p6.message ?? "Seu cadastro como membro foi concluído.",
        icon: "account-check",
        color: "green",
        createdAt: new Date(dto.createdAt),
        readAt: dto.readAt ? new Date(dto.readAt) : null,
        raw: dto,
      };
    }
  }
}
