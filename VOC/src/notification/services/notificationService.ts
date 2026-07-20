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

  read: async (id: string) => {
    const response = await churchApi.patch(`/notifications/${id}/read`);
    return response.data;
  },
};
