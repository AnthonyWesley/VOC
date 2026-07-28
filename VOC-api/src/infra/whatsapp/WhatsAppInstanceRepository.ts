import { WhatsAppInstance } from "@prisma/client";

export type CreateWhatsAppInstanceData = {
  instanceName: string;
  userId: string;
  isActive: boolean;
};

export interface WhatsAppInstanceRepository {
  findActiveByName(instanceName: string): Promise<WhatsAppInstance | null>;
  findByInstanceName(instanceName: string): Promise<WhatsAppInstance | null>;
  findActiveByUserId(userId: string): Promise<WhatsAppInstance | null>;
  create(data: CreateWhatsAppInstanceData): Promise<WhatsAppInstance>;
  deleteByInstanceName(instanceName: string): Promise<void>;
}
