import { prisma } from "../../../../package/prisma";
import { PrismaMemberRepository } from "../../domain/repositories/PrismaMemberRepository";
import { CreateMemberUseCase } from "../../usecases/CreateMemberUseCase";
import { DeleteMemberUseCase } from "../../usecases/DeleteMemberUseCase";
import { GetMemberDetailedUseCase } from "../../usecases/GetMemberDetailedUseCase";
import { ListMembersUseCase } from "../../usecases/ListMembersUseCase";
import { UpdateMemberUseCase } from "../../usecases/UpdateMemberUseCase";
import { MemberController } from "../controllers/MemberController";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";
import { createNotificationUseCase } from "../../../notification/infra/container";

const memberRepository = new PrismaMemberRepository(prisma);

const create = new CreateMemberUseCase(memberRepository, whatsAppService, createNotificationUseCase);
const update = new UpdateMemberUseCase(memberRepository);
const get = new GetMemberDetailedUseCase(memberRepository);
const list = new ListMembersUseCase(memberRepository);
const del = new DeleteMemberUseCase(memberRepository);

export const memberController = new MemberController(create, update, get, list, del);