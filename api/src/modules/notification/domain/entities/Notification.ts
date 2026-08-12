import { NotificationType } from "@prisma/client";

export type { NotificationType };

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  payload: Record<string, unknown> | null;
  payloadVersion: number;
  readAt: string | null;
  createdAt: string;
};

export type NotificationProps = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  payload?: Record<string, unknown> | null;
  payloadVersion: number;
  deduplicationKey?: string | null;
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
  get payloadVersion() { return this.props.payloadVersion; }
  get deduplicationKey() { return this.props.deduplicationKey ?? null; }
  get readAt() { return this.props.readAt ?? null; }
  get createdAt() { return this.props.createdAt; }

  markAsRead(): void {
    this.props.readAt = new Date();
  }

  get isRead(): boolean {
    return !!this.props.readAt;
  }

  toDTO(): NotificationDTO {
    return {
      id: this.props.id,
      type: this.props.type,
      title: this.props.title,
      message: this.props.message ?? null,
      payload: this.props.payload ?? null,
      payloadVersion: this.props.payloadVersion,
      readAt: this.props.readAt?.toISOString() ?? null,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
