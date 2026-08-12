import { NotificationDTO } from "./NotificationDTO";

export type NotificationUIModel = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  createdAt: Date;
  readAt: Date | null;
  raw: NotificationDTO;
};
