import { PrismaClient } from "@prisma/client";
import { IEventAdminRecipientReader, MINIMUM_EVENT_ADMIN_LEVEL } from "../../domain/services/IEventAdminRecipientReader";

export class PrismaEventAdminRecipientReader implements IEventAdminRecipientReader {
  constructor(private readonly prisma: PrismaClient) {}

  async findEventAdminUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true, roles: { some: { role: { level: { gte: MINIMUM_EVENT_ADMIN_LEVEL } } } } },
      select: { id: true },
    });
    return users.map(u => u.id);
  }
}
