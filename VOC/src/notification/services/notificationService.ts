import churchApi from "../../api/axios";
import { NotificationDTO } from "../types/NotificationDTO";

export const notificationService = {
  getNotification: async (params?: {
    offset?: number;
    limit?: number;
  }): Promise<{ items: NotificationDTO[]; totalCount: number }> => {
    const response = await churchApi.get("/notifications", { params });
    return response.data;
  },

  read: async (id: string): Promise<void> => {
    await churchApi.patch(`/notifications/${id}/read`);
  },

  readAll: async (): Promise<{ updated: number }> => {
    const response = await churchApi.patch("/notifications/read-all");
    return response.data;
  },

  unreadCount: async (): Promise<{ count: number }> => {
    const response = await churchApi.get("/notifications/unread-count");
    return response.data;
  },
};
