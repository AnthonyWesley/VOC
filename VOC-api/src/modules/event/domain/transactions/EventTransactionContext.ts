import { IEventRepository } from "../repositories/IEventRepository";
import { IEventAssignmentRepository } from "../repositories/IEventAssignmentRepository";
import { INotificationRepository } from "../../../notification/domain/repositories/INotificationRepository";
import { ICategoryRepository } from "../../../category/domain/repositories/ICategoryRepository";
import { IMinistryRepository } from "../../../ministry/domain/repositories/IMinistryRepository";

export type EventCategoryReader = Pick<ICategoryRepository, "findById">;
export type EventMinistryReader = Pick<IMinistryRepository, "findById">;

export type EventTransactionContext = {
  eventRepository: IEventRepository;
  assignmentRepository: IEventAssignmentRepository;
  notificationRepository: INotificationRepository;
  categoryReader: EventCategoryReader;
  ministryReader: EventMinistryReader;
};
