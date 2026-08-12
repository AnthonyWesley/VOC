import { IMinistryMembershipRepository } from "../repositories/IMinistryMembershipRepository";
import { INotificationRepository } from "../../../notification/domain/repositories/INotificationRepository";

export type MinistryMembershipTransactionRepositories = {
  memberships: IMinistryMembershipRepository;
  notifications: INotificationRepository;
};

export interface IMinistryMembershipTransaction {
  execute<T>(
    callback: (repositories: MinistryMembershipTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
