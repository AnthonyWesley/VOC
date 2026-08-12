import { prisma } from "../../package/prisma";
import { notificationRepository, createNotificationUseCase } from "../../modules/notification/infra/container";
import { NotifyInactiveMembersUseCase } from "../../modules/notification/usecases/NotifyInactiveMembersUseCase";
import { whatsAppService } from "../whatsapp/whatsappContainer";
import { PrismaJobLeaseRepository } from "./PrismaJobLeaseRepository";
import { RunInactiveMembersJobUseCase } from "./RunInactiveMembersJobUseCase";

function parseLeaseTtlSeconds(value: string | undefined): number {
  const fallback = 300;

  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 30 || parsed > 3600) {
    throw new Error(
      "INACTIVE_MEMBERS_JOB_LEASE_TTL_SECONDS must be an integer between 30 and 3600",
    );
  }

  return parsed;
}

const leaseTtlSeconds = parseLeaseTtlSeconds(process.env.INACTIVE_MEMBERS_JOB_LEASE_TTL_SECONDS);

const jobLeaseRepository = new PrismaJobLeaseRepository(prisma);
const notifyInactiveMembers = new NotifyInactiveMembersUseCase(
  prisma,
  notificationRepository,
  createNotificationUseCase,
  whatsAppService,
);

export { jobLeaseRepository };

export const runInactiveMembersJob = new RunInactiveMembersJobUseCase(
  jobLeaseRepository,
  notifyInactiveMembers,
  leaseTtlSeconds,
);
