import { prisma } from "../../package/prisma";
import { IWhatsAppService } from "./IWhatsAppService";
import { NullWhatsAppService } from "./NullWhatsAppService";
import { WhatsAppInstanceService } from "./WhatsAppInstanceService";
import { PrismaWhatsAppInstanceRepository } from "./PrismaWhatsAppInstanceRepository";

let whatsAppService: IWhatsAppService = new NullWhatsAppService();

export function setWhatsAppService(service: IWhatsAppService) {
  whatsAppService = service;
}

export function createRealWhatsAppService(): IWhatsAppService {
  const repo = new PrismaWhatsAppInstanceRepository(prisma);
  return new WhatsAppInstanceService(repo);
}

export { whatsAppService };
