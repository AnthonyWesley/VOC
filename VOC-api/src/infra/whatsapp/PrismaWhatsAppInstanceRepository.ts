import { PrismaClient, WhatsAppInstance } from "@prisma/client";
import { WhatsAppInstanceRepository } from "./WhatsAppInstanceRepository";

export class PrismaWhatsAppInstanceRepository implements WhatsAppInstanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveByName(instanceName: string): Promise<WhatsAppInstance | null> {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { instanceName, isActive: true },
    });
    if (instance) return instance;
    return this.prisma.whatsAppInstance.findFirst({
      where: { isActive: true },
    });
  }
}
