import { prisma } from "../../../../package/prisma";
import { PrismaMemberRepository } from "../../domain/repositories/PrismaMemberRepository";
import { CreateMemberUseCase } from "../../usecases/CreateMemberUseCase";
import { DeleteMemberUseCase } from "../../usecases/DeleteMemberUseCase";
import { GetMemberDetailedUseCase } from "../../usecases/GetMemberDetailedUseCase";
import { ListMembersUseCase } from "../../usecases/ListMembersUseCase";
import { UpdateMemberUseCase } from "../../usecases/UpdateMemberUseCase";
import { MemberController } from "../controllers/MemberController";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";
import { PrismaNotificationRepository } from "../../../notification/domain/repositories/PrismaNotificationRepository";
import { CreateNotificationUseCase } from "../../../notification/usecases/CreateNotificationUseCase";

const memberRepository = new PrismaMemberRepository(prisma);
const notificationRepository = new PrismaNotificationRepository(prisma);
const createNotification = new CreateNotificationUseCase(notificationRepository);

const create = new CreateMemberUseCase(memberRepository, whatsAppService, createNotification);
const update = new UpdateMemberUseCase(memberRepository);
const get = new GetMemberDetailedUseCase(memberRepository);
const list = new ListMembersUseCase(memberRepository);
const del = new DeleteMemberUseCase(memberRepository);

export const memberController = new MemberController(create, update, get, list, del);