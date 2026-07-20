import { IWhatsAppService } from "./IWhatsAppService";
import { NullWhatsAppService } from "./NullWhatsAppService";

let whatsAppService: IWhatsAppService = new NullWhatsAppService();

export function setWhatsAppService(service: IWhatsAppService) {
  whatsAppService = service;
}

export { whatsAppService };
