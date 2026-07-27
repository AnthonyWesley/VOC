import { IEventAssignmentRepository } from "../repositories/IEventAssignmentRepository";
import { INotificationRepository } from "../../../notification/domain/repositories/INotificationRepository";

export type AssignMemberTransactionRepositories = {
  assignments: IEventAssignmentRepository;
  notifications: INotificationRepository;
};

export interface IAssignMemberTransaction {
  execute<T>(callback: (repos: AssignMemberTransactionRepositories) => Promise<T>): Promise<T>;
}
