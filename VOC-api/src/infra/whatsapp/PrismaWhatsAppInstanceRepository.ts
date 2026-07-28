import { PrismaClient, WhatsAppInstance } from "@prisma/client";
import { generateId } from "../../shared/utils/generateId";
import { WhatsAppInstanceRepository, CreateWhatsAppInstanceData } from "./WhatsAppInstanceRepository";

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

  async findByInstanceName(instanceName: string): Promise<WhatsAppInstance | null> {
    return this.prisma.whatsAppInstance.findUnique({
      where: { instanceName },
    });
  }

  async findActiveByUserId(userId: string): Promise<WhatsAppInstance | null> {
    return this.prisma.whatsAppInstance.findFirst({
      where: { userId, isActive: true },
    });
  }

  async create(data: CreateWhatsAppInstanceData): Promise<WhatsAppInstance> {
    return this.prisma.whatsAppInstance.create({ data: { ...data, id: generateId() } });
  }

  async deleteByInstanceName(instanceName: string): Promise<void> {
    await this.prisma.whatsAppInstance.deleteMany({ where: { instanceName } });
  }
}
