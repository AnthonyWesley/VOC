// types/dashboard.types.ts

export type EventType =
  | "HOUSE_SERVICE"
  | "SUNDAY_SERVICE"
  | "PRAYER_MEETING"
  | "BIBLE_STUDY"
  | "YOUTH_NIGHT"
  | "SPECIAL_EVENT";

export interface DashboardMember {
  total: number;
  active: number;
  visitors: number;
  transferred: number;
  newThisMonth: number;
}

export interface DashboardFinance {
  incomeThisMonth: number;
  expenseThisMonth: number;
  balanceThisMonth: number;
}

export interface ChurchEvent {
  id: string;
  title: string;
  startsAt: string;
  attendance?: {
    membersCount: number;
  };
}

export interface InactiveMember {
  memberId: string;
  memberName: string;
  memberPhone?: string | null;
  daysSinceLastEvent: number;
}

export interface Post {
  id: string;
  title: string;
  // adicione os outros campos reais do seu PostCard aqui
}

export interface DashboardData {
  members: DashboardMember;
  finance: DashboardFinance;
  events: {
    last: ChurchEvent | null;
    upcoming: ChurchEvent[];
  };
  posts: Post[];
  inactiveMembers: Record<EventType, InactiveMember[]>;
}
