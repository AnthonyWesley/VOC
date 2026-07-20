import { generateId } from "../../../../shared/utils/generateId";

export type EventAttendanceProps = {
  id: string;
  eventId: string;
  membersCount: number;
  visitorsCount: number;

  createdAt: Date;
  updatedAt: Date;
};

export type CreateEventAttendanceProps = {
  eventId: string;
  membersCount: number;
  visitorsCount: number;
};

export class EventAttendance {
  private constructor(private props: EventAttendanceProps) {}

  // ---------------------------
  // CREATE
  // ---------------------------
  public static create(data: CreateEventAttendanceProps): EventAttendance {
    if (!data.eventId) throw new Error("EventId is required");
    // if (!data.membersCount) throw new Error("MembersCount is required");
    // if (!data.visitorsCount) throw new Error("VisitorsCount is required");

    const now = new Date();

    return new EventAttendance({
      id: generateId(),
      eventId: data.eventId,
      membersCount: data.membersCount,
      visitorsCount: data.visitorsCount,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ---------------------------
  // REHYDRATE
  // ---------------------------
  public static rehydrate(props: EventAttendanceProps): EventAttendance {
    return new EventAttendance({ ...props });
  }

  // ---------------------------
  // UPDATE
  // ---------------------------
  public update(data: Partial<CreateEventAttendanceProps>): void {
    let changed = false;

    const fields: (keyof CreateEventAttendanceProps)[] = [
      "membersCount",
      "visitorsCount",
    ];

    for (const field of fields) {
      if (data[field] !== undefined && data[field] !== this.props[field]) {
        (this.props as any)[field] = data[field];
        changed = true;
      }
    }

    if (changed) {
      this.props.updatedAt = new Date();
    }
  }

  // ---------------------------
  // GETTERS
  // ---------------------------
  public get id() {
    return this.props.id;
  }

  public get eventId() {
    return this.props.eventId;
  }

  public get visitorsCount() {
    return this.props.visitorsCount;
  }

  public get membersCount() {
    return this.props.membersCount;
  }

  public get createdAt() {
    return this.props.createdAt;
  }

  public get updatedAt() {
    return this.props.updatedAt;
  }
}
