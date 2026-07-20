export interface IWhatsAppService {
  sendMessage(to: string, message: string, instanceName: string): Promise<void>;
}
