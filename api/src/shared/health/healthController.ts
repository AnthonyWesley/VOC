import { PrismaClient } from "@prisma/client";

export type HealthDependency = "database" | "whatsapp";

export type HealthCheckResult = {
  status: "ok" | "degraded" | "error";
  dependencies: Record<HealthDependency, "up" | "down" | "configured" | "not_configured">;
};

export class HealthController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly whatsAppConfigured: () => boolean,
  ) {}

  async checkReadiness(): Promise<HealthCheckResult> {
    const deps: HealthCheckResult["dependencies"] = {
      database: "down",
      whatsapp: "not_configured",
    };

    try {
      await this.prisma.$queryRawUnsafe(`SELECT 1`);
      deps.database = "up";
    } catch {
      return { status: "error", dependencies: deps };
    }

    try {
      const configured = this.whatsAppConfigured();
      deps.whatsapp = configured ? "configured" : "not_configured";
    } catch {
      deps.whatsapp = "down";
    }

    const status =
      deps.database === "up" ? "ok" : "degraded";

    return { status, dependencies: deps };
  }
}
