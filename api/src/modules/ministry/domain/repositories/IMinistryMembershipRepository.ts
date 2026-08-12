export type MemberMinistryRecord = {
  memberId: string;
  ministryId: string;
  joinedAt: Date;
};

export interface IMinistryMembershipRepository {
  create(input: { memberId: string; ministryId: string }): Promise<MemberMinistryRecord>;
  find(memberId: string, ministryId: string): Promise<MemberMinistryRecord | null>;
  delete(memberId: string, ministryId: string): Promise<boolean>;
}
