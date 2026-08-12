import { PrismaClient } from "@prisma/client";
import { ISiteTimezoneProvider } from "../domain/ISiteTimezoneProvider";

type TimezoneDb = Pick<PrismaClient, "siteContentSettings">;

export class PrismaSiteTimezoneProvider implements ISiteTimezoneProvider {
  constructor(private readonly db: TimezoneDb) {}

  async getTimezone(): Promise<string> {
    const settings = await this.db.siteContentSettings.findUnique({
      where: { id: "main" },
      select: { timezone: true },
    });

    return settings?.timezone ?? "America/Sao_Paulo";
  }
}
