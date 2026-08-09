import { IMinistryRepository } from "../repositories/IMinistryRepository";
import { IMinistryRestoreLogRepository } from "../repositories/IMinistryRestoreLogRepository";

export type MinistryTransactionContext = {
  ministryRepository: IMinistryRepository;
  restoreLogRepository: IMinistryRestoreLogRepository;
};