export type BaseNotificationDTO = {
  id: string;
  createdAt: string;
  readAt: string | null;
};

export type NotificationDTO =
  | (BaseNotificationDTO & {
      type: "EVENTO_CRIADO";
      payload: string;
    })
  | (BaseNotificationDTO & {
      type: "ESCALA_PENDENTE";
      payload: string;
    })
  | (BaseNotificationDTO & {
      type: "MEMBRO_ESCALADO";
      payload: string;
    })
  | (BaseNotificationDTO & {
      type: "MEMBER_AUSENTE";
      payload: string;
    })
  | (BaseNotificationDTO & {
      type: "MEMBRO_REMOVIDO";
      payload: string;
    })
  | (BaseNotificationDTO & {
      type: "MEMBRO_VINCULADO";
      payload: string;
    });
