import { PostListItemDTO } from "../../../post/domain/repositories/IPostRepository";

export interface DashboardMembersStats {
  total: number;
  active: number;
  visitors: number;
  transferred: number;
  newThisMonth: number;
}

export interface DashboardFinanceStats {
  incomeThisMonth: number;
  expenseThisMonth: number;
  balanceThisMonth: number;
}

export interface DashboardServiceStats {
  upcoming: Array<{
    id: string;
    title: string | null;
    startsAt: Date;
    type: string;
  }>;
  last:
    | ({
        id: string;
        title: string | null;
        startsAt: Date;
        type: string;
        attendance: {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          eventId: string;
          membersCount: number;
          visitorsCount: number;
        } | null;
      })
    | null;
}

export interface InactiveMemberItem {
  memberId: string;
  memberName: string;
  memberPhone: string | null;
  lastEventDate: Date;
  daysSinceLastEvent: number;
}

export interface DashboardInactiveMembers {
  [eventType: string]: InactiveMemberItem[];
}

export interface DashboardData {
  members: DashboardMembersStats;
  events: DashboardServiceStats;
  finance: DashboardFinanceStats;
  posts: PostListItemDTO[];
  inactiveMembers: DashboardInactiveMembers;
}

export interface IDashboardRepository {
  getDashboardData(): Promise<DashboardData>;
}
