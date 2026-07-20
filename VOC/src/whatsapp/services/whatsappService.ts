import churchApi from "../../api/axios";

export type WhatsAppInstanceDTO = {
  id: string;
  instanceName: string;
  number: string | null;
  isActive: boolean;
  state: string;
  createdAt: string;
  updatedAt: string;
};

export type QrCodeResponse = {
  qrcode: string | null;
  pairingCode: string | null;
};

export const whatsappService = {
  getInstance: async (): Promise<{ instance: WhatsAppInstanceDTO | null }> => {
    const response = await churchApi.get("/whatsapp/instance");
    return response.data;
  },

  createInstance: async (instanceName: string): Promise<QrCodeResponse & { instanceName: string }> => {
    const response = await churchApi.post("/whatsapp/instance", { instanceName });
    return response.data;
  },

  getQrCode: async (instanceName: string): Promise<QrCodeResponse> => {
    const response = await churchApi.get(`/whatsapp/instance/${instanceName}/qrcode`);
    return response.data;
  },

  getState: async (instanceName: string): Promise<{ state: string }> => {
    const response = await churchApi.get(`/whatsapp/instance/${instanceName}/state`);
    return response.data;
  },

  deleteInstance: async (instanceName: string): Promise<void> => {
    await churchApi.delete(`/whatsapp/instance/${instanceName}`);
  },

  restartInstance: async (instanceName: string): Promise<void> => {
    await churchApi.post(`/whatsapp/instance/${instanceName}/restart`);
  },
};
