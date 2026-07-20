import { IWhatsAppService } from "./IWhatsAppService";

export class NullWhatsAppService implements IWhatsAppService {
  async sendMessage() {}
}
