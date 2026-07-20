export type EventType =
  | "SUNDAY_SERVICE"
  | "HOUSE_SERVICE"
  | "PRAYER_MEETING"
  | "BIBLE_STUDY"
  | "YOUTH_NIGHT"
  | "SPECIAL_EVENT";

export type CloseEventInput = {
  event: {
    id?: string; // se for update
    title?: string | null;
    type: EventType;
    startsAt: string;
    endsAt?: string | null;
    // createdAt: string;
    preacherId?: string | null;
    theme?: string | null;
    notes?: string | null;
  };
  attendance?: {
    membersCount: number;
    visitorsCount: number;
  };
};

export type ListEventsInput = {
  limit: number;
  cursor?: string | null;
  type?: EventType | null;
  month: number; // 1-12
  year: number;
};

export type ListEventsOutput = {
  id: string;
  title?: string | null;
  type: EventType;
  startsAt: Date;
  endsAt?: Date | null;
  preacherId?: string | null;
  theme?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export type PaginatedEventsOutput = {
  data: ListEventsOutput[];
  nextCursor: string | null;
};

export type DetailedEventDTO = {
  id: string;
  title: string | null;
  type: EventType;
  startsAt: Date;
  endsAt: Date | null;
  theme: string | null;
  notes: string | null;
  preacherId: string | null;

  preacher: {
    id: string;
    fullName: string;
    email?: string;
    photoUrl?: string;
  } | null;

  members: Array<{
    id: string;
    fullName: string;
    birthDate: Date;
  }>;

  assignments: Array<{
    id: string;
    member: {
      id: string;
      fullName: string;
      photoUrl?: string;
    };
    ministry: {
      id: string;
      name: string;
    };
    description: string | null;
    assignedAt: Date;
  }>;

  attendance: {
    membersCount: number;
    visitorsCount: number;
  } | null;

  createdById: string | null;
  createdBy: { id: string; email: string; fullName: string | null; roleName: string | null } | null;
  deletedById: string | null;
  deletedAt: Date | null;
  deletedBy: { id: string; email: string } | null;
  deleteReason: string | null;

  createdAt: Date;
  updatedAt: Date;
};
