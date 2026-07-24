import { prisma } from "../../../../package/prisma";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { PrismaCategoryRepository } from "../../../category/domain/repositories/PrismaCategoryRepository";
import { AssignMemberToEventUseCase } from "../../usecases/AssignMemberToEventUseCase";
import { CancelEventUseCase } from "../../usecases/CancelEventUseCase";
import { CloseEventWithSummaryUseCase } from "../../usecases/CloseEventWithSummaryUseCase";
import { CorrectEventUseCase } from "../../usecases/CorrectEventUseCase";
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
const softDelete = new DeleteEventUseCase(eventRepository, prisma);
const update = new UpdateEventUseCase(eventRepository);
const cancelEvent = new CancelEventUseCase(eventRepository);
const correctEvent = new CorrectEventUseCase(eventRepository, prisma);

const assignMember = new AssignMemberToEventUseCase(eventRepository, prisma, socketServer);
const removeMember = new RemoveMemberFromEventUseCase(eventRepository, prisma, socketServer, createNotificationUseCase);

export const eventController = new EventController(
  close,
  get,
  list,
  softDelete,
  update,
  cancelEvent,
  correctEvent,
  assignMember,
  removeMember,
  monthlyReport,
);
