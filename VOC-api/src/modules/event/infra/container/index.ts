import { prisma } from "../../../../package/prisma";
import { PrismaEventRepository } from "../../domain/repositories/PrismaEventRepository";
import { PrismaEventReportRepository } from "../repositories/PrismaEventReportRepository";
import { PrismaEventCriticalSection } from "../transactions/PrismaEventCriticalSection";
import { PrismaEventWriteTransaction } from "../transactions/PrismaEventWriteTransaction";
import { PrismaEventAdminRecipientReader } from "../services/PrismaEventAdminRecipientReader";
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
import { socketServer, realtimePublisher } from "../../../../infra/socket/socketContainer";
import { createNotificationUseCase } from "../../../notification/infra/container";
import { whatsAppService } from "../../../../infra/whatsapp/whatsappContainer";
import { PrismaEventAssignmentRepository } from "../repositories/PrismaEventAssignmentRepository";
import { PrismaSiteTimezoneProvider } from "../../../../site-content/infra/PrismaSiteTimezoneProvider";
import { SystemClock } from "../../../../shared/infra/SystemClock";

const eventRepository = new PrismaEventRepository(prisma);
const eventReportRepository = new PrismaEventReportRepository(prisma);

const timezoneProvider = new PrismaSiteTimezoneProvider(prisma);
const clock = new SystemClock();

const criticalSection = new PrismaEventCriticalSection(prisma);
const writeTransaction = new PrismaEventWriteTransaction(prisma);
const adminRecipientReader = new PrismaEventAdminRecipientReader(prisma);

const close = new CloseEventWithSummaryUseCase(eventRepository, criticalSection, writeTransaction, adminRecipientReader, socketServer, createNotificationUseCase, realtimePublisher);
const get = new GetEventDetailedUseCase(eventRepository);
const list = new ListEventsUseCase(eventRepository);
const monthlyReport = new GetMonthlyEventReportUseCase(eventReportRepository, timezoneProvider, clock);
const softDelete = new DeleteEventUseCase(eventRepository, criticalSection);
const update = new UpdateEventUseCase(eventRepository);
const cancelEvent = new CancelEventUseCase(eventRepository, criticalSection);
const correctEvent = new CorrectEventUseCase(eventRepository, prisma);

const assignmentLookup = new PrismaEventAssignmentRepository(prisma);

const assignMember = new AssignMemberToEventUseCase(eventRepository, assignmentLookup, criticalSection, createNotificationUseCase, prisma, whatsAppService, realtimePublisher);
const removeMember = new RemoveMemberFromEventUseCase(eventRepository, criticalSection, prisma, socketServer, createNotificationUseCase, whatsAppService, realtimePublisher);

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
