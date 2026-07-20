import { prisma } from "../../../../package/prisma";
import { PrismaMinistryRepository } from "../../domain/repositories/PrismaMinistryRepository";
import { AssignMemberToMinistryUseCase } from "../../usecases/AssignMemberToMinistryUseCase";
import { CreateMinistryUseCase } from "../../usecases/CreateMinistryUseCase";
import { DeleteMinistryUseCase } from "../../usecases/DeleteMinistryUseCase";
import { GetMinistryDetailedUseCase } from "../../usecases/GetMinistryDetailedUseCase";
import { ListMinistriesUseCase } from "../../usecases/ListMinistriesUseCase";
import { RemoveMemberFromMinistryUseCase } from "../../usecases/RemoveMemberFromMinistryUseCase";
import { UpdateMinistryUseCase } from "../../usecases/UpdateMinistryUseCase";
import { MinistryController } from "../controllers/MinistryController";

const ministryRepository = new PrismaMinistryRepository(prisma);

const create = new CreateMinistryUseCase(ministryRepository);
const update = new UpdateMinistryUseCase(ministryRepository);
const get = new GetMinistryDetailedUseCase(ministryRepository);
const list = new ListMinistriesUseCase(prisma);
const del = new DeleteMinistryUseCase(ministryRepository);
const assignMember = new AssignMemberToMinistryUseCase(ministryRepository, prisma);
const removeMember = new RemoveMemberFromMinistryUseCase(ministryRepository, prisma);

export const ministryController = new MinistryController(
  create,
  update,
  del,
  assignMember,
  removeMember,
  get,
  list,
);
