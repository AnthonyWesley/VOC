import { prisma } from "../../package/prisma";
import { IWhatsAppService } from "./IWhatsAppService";
import type { IWhatsAppAdminService } from "./IWhatsAppAdminService";
import { NullWhatsAppService } from "./NullWhatsAppService";
import { NullWhatsAppAdminService } from "./NullWhatsAppAdminService";
import { WhatsAppInstanceService } from "./WhatsAppInstanceService";
import { PrismaWhatsAppInstanceRepository } from "./PrismaWhatsAppInstanceRepository";

let whatsAppService: IWhatsAppService = new NullWhatsAppService();
let whatsAppAdminService: IWhatsAppAdminService = new NullWhatsAppAdminService();

export function setWhatsAppService(service: IWhatsAppService) {
  whatsAppService = service;
}

export function setWhatsAppAdminService(service: IWhatsAppAdminService) {
  whatsAppAdminService = service;
}

export function createRealWhatsAppService(): WhatsAppInstanceService {
  const repo = new PrismaWhatsAppInstanceRepository(prisma);
  return new WhatsAppInstanceService(repo);
}

export { whatsAppService, whatsAppAdminService };
