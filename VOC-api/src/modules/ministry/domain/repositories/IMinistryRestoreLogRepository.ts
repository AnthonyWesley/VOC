export type MinistryRestoreLogChanges = Record<
  string,
  { before: unknown; after: unknown }
>;

export type CreateMinistryRestoreLogInput = {
  ministryId: string;
  restoredById: string;
  reason: string;
  changes: MinistryRestoreLogChanges;
};

export interface IMinistryRestoreLogRepository {
  create(input: CreateMinistryRestoreLogInput): Promise<void>;
}