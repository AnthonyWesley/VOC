export type MemberRestoreLogChanges = Record<
  string,
  { before: unknown; after: unknown }
>;

export type CreateMemberRestoreLogInput = {
  memberId: string;
  restoredById: string;
  reason: string;
  changes: MemberRestoreLogChanges;
};

export interface IMemberRestoreLogRepository {
  create(input: CreateMemberRestoreLogInput): Promise<void>;
}