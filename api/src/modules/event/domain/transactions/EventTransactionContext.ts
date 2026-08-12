import { IEventRepository } from "../repositories/IEventRepository";
import { IEventAssignmentRepository } from "../repositories/IEventAssignmentRepository";
import { IEventCorrectionRepository } from "../repositories/IEventCorrectionRepository";
import { INotificationRepository } from "../../../notification/domain/repositories/INotificationRepository";
import { ICategoryRepository } from "../../../category/domain/repositories/ICategoryRepository";
import { IMinistryRepository } from "../../../ministry/domain/repositories/IMinistryRepository";
import { IMemberRepository } from "../../../membership/domain/repositories/IMemberRepository";

export type EventCategoryReader = Pick<ICategoryRepository, "findById">;
export type EventMinistryReader = Pick<IMinistryRepository, "findById">;
export type EventMemberReader = Pick<IMemberRepository, "findById">;

export type EventTransactionContext = {
  eventRepository: IEventRepository;
  assignmentRepository: IEventAssignmentRepository;
  correctionRepository: IEventCorrectionRepository;
  notificationRepository: INotificationRepository;
  categoryReader: EventCategoryReader;
  ministryReader: EventMinistryReader;
  memberReader: EventMemberReader;
};
