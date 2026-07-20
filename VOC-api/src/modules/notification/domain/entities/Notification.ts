export type NotificationType = "MEMBER_AUSENTE" | "MEMBRO_VINCULADO" | "MEMBRO_REMOVIDO" | "EVENTO_CRIADO" | "ESCALA_PENDENTE" | "MEMBRO_ESCALADO";

export type NotificationProps = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  payload?: string;
  readAt?: Date | null;
  createdAt: Date;
};

export class Notification {
  constructor(private props: NotificationProps) {}

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get type() { return this.props.type; }
  get title() { return this.props.title; }
  get message() { return this.props.message ?? null; }
  get payload() { return this.props.payload ?? null; }
  get readAt() { return this.props.readAt ?? null; }
  get createdAt() { return this.props.createdAt; }

  markAsRead(): void {
    this.props.readAt = new Date();
  }

  get isRead(): boolean {
    return !!this.props.readAt;
  }

  toJSON() {
    return { ...this.props };
  }
}
