import { WhatsAppInstance } from "@prisma/client";

export interface WhatsAppInstanceRepository {
  findActiveByName(instanceName: string): Promise<WhatsAppInstance | null>;
}
