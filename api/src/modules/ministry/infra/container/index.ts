import { prisma } from "../../../../package/prisma";
import { PrismaMinistryRepository } from "../../domain/repositories/PrismaMinistryRepository";
import { PrismaMinistryCriticalSection } from "../transactions/PrismaMinistryCriticalSection";
import { AssignMemberToMinistryUseCase } from "../../usecases/AssignMemberToMinistryUseCase";
import { CreateMinistryUseCase } from "../../usecases/CreateMinistryUseCase";
import { DeleteMinistryUseCase } from "../../usecases/DeleteMinistryUseCase";
import { GetMinistryDetailedUseCase } from "../../usecases/GetMinistryDetailedUseCase";
import { ListMinistriesUseCase } from "../../usecases/ListMinistriesUseCase";
import { RemoveMemberFromMinistryUseCase } from "../../usecases/RemoveMemberFromMinistryUseCase";
import { RestoreMinistryUseCase } from "../../usecases/RestoreMinistryUseCase";
import { UpdateMinistryUseCase } from "../../usecases/UpdateMinistryUseCase";
import { MinistryController } from "../controllers/MinistryController";
import { PrismaMinistryMembershipTransaction } from "../transactions/PrismaMinistryMembershipTransaction";
import { createNotificationUseCase } from "../../../notification/infra/container";
import { socketServer, realtimePublisher } from "../../../../infra/socket/socketContainer";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";

const ministryRepository = new PrismaMinistryRepository(prisma);
const ministryCriticalSection = new PrismaMinistryCriticalSection(prisma);

const create = new CreateMinistryUseCase(ministryRepository);
const update = new UpdateMinistryUseCase(ministryRepository);
const get = new GetMinistryDetailedUseCase(ministryRepository);
const list = new ListMinistriesUseCase(ministryRepository);
const del = new DeleteMinistryUseCase(ministryRepository, ministryCriticalSection);
const restore = new RestoreMinistryUseCase(ministryRepository, ministryCriticalSection);

const membershipTransaction = new PrismaMinistryMembershipTransaction(prisma);
const assignMember = new AssignMemberToMinistryUseCase(
  membershipTransaction,
  ministryRepository,
  prisma,
  createNotificationUseCase,
  realtimePublisher,
  whatsAppService,
);
const removeMember = new RemoveMemberFromMinistryUseCase(
  membershipTransaction,
  ministryRepository,
  prisma,
  createNotificationUseCase,
  realtimePublisher,
  whatsAppService,
);

export const ministryController = new MinistryController(
  create,
  update,
  del,
  assignMember,
  removeMember,
  get,
  list,
  restore,
);