import { NotificationType } from "./NotificationType";

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  payload: unknown;
  payloadVersion: number;
  createdAt: string;
  readAt: string | null;
};
