import { prisma } from "../../../../package/prisma";
import { PrismaMemberRepository } from "../../domain/repositories/PrismaMemberRepository";
import { PrismaMemberRestoreLogRepository } from "../repositories/PrismaMemberRestoreLogRepository";
import { PrismaMemberCriticalSection } from "../transactions/PrismaMemberCriticalSection";
import { CreateMemberUseCase } from "../../usecases/CreateMemberUseCase";
import { DeleteMemberUseCase } from "../../usecases/DeleteMemberUseCase";
import { GetMemberDetailedUseCase } from "../../usecases/GetMemberDetailedUseCase";
import { ListMembersUseCase } from "../../usecases/ListMembersUseCase";
import { UpdateMemberUseCase } from "../../usecases/UpdateMemberUseCase";
import { RestoreMemberUseCase } from "../../usecases/RestoreMemberUseCase";
import { MemberController } from "../controllers/MemberController";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";
import { createNotificationUseCase } from "../../../notification/infra/container";

const memberRepository = new PrismaMemberRepository(prisma);
const memberCriticalSection = new PrismaMemberCriticalSection(prisma);

const create = new CreateMemberUseCase(memberRepository, whatsAppService, createNotificationUseCase);
const update = new UpdateMemberUseCase(memberRepository);
const get = new GetMemberDetailedUseCase(memberRepository);
const list = new ListMembersUseCase(memberRepository);
const del = new DeleteMemberUseCase(memberRepository, memberCriticalSection);
const restore = new RestoreMemberUseCase(memberRepository, memberCriticalSection);

export const memberController = new MemberController(create, update, get, list, del, restore);