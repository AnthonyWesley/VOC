import { prisma } from "../../../../package/prisma";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { PrismaCategoryRepository } from "../../../category/domain/repositories/PrismaCategoryRepository";
import { AssignMemberToEventUseCase } from "../../usecases/AssignMemberToEventUseCase";
import { CloseEventWithSummaryUseCase } from "../../usecases/CloseEventWithSummaryUseCase";
import { DeleteEventUseCase } from "../../usecases/DeleteEventUseCase";
import { UpdateEventUseCase } from "../../usecases/UpdateEventUseCase";
import { GetEventDetailedUseCase } from "../../usecases/GetEventDetailedUseCase";
import { GetMonthlyEventReportUseCase } from "../../usecases/GetMonthlyEventReportUseCase";
import { ListEventsUseCase } from "../../usecases/ListEventsUseCase";
import { RemoveMemberFromEventUseCase } from "../../usecases/RemoveMemberFromEventUseCase";
import { EventController } from "../controllers/EventController";
import { socketServer } from "../../../../infra/socket/socketContainer";
import { createNotificationUseCase } from "../../../notification/infra/container";

const eventRepository = new PrismaEventRepository(prisma);
const categoryRepository = new PrismaCategoryRepository(prisma);

const close = new CloseEventWithSummaryUseCase(eventRepository, categoryRepository, prisma, socketServer, createNotificationUseCase);
const get = new GetEventDetailedUseCase(eventRepository);
const list = new ListEventsUseCase(eventRepository);
const monthlyReport = new GetMonthlyEventReportUseCase(eventRepository);
const softDelete = new DeleteEventUseCase(eventRepository);
const update = new UpdateEventUseCase(eventRepository);

const assignMember = new AssignMemberToEventUseCase(eventRepository, prisma, socketServer, createNotificationUseCase);
const removeMember = new RemoveMemberFromEventUseCase(eventRepository, prisma, socketServer, createNotificationUseCase);

export const eventController = new EventController(
  close,
  get,
  list,
  softDelete,
  update,
  assignMember,
  removeMember,
  monthlyReport,
);
