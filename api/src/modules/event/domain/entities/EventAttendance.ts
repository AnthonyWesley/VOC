import { generateId } from "../../../../shared/utils/generateId";
import { ValidationError } from "../../../../shared/errors/ValidationError";

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

  public static create(data: CreateEventAttendanceProps): EventAttendance {
    if (!data.eventId) throw new ValidationError("MISSING_EVENT_ID");
    if (!Number.isInteger(data.membersCount) || data.membersCount < 0) {
      throw new ValidationError("INVALID_MEMBERS_COUNT");
    }
    if (!Number.isInteger(data.visitorsCount) || data.visitorsCount < 0) {
      throw new ValidationError("INVALID_VISITORS_COUNT");
    }

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

  public static rehydrate(props: EventAttendanceProps): EventAttendance {
    return new EventAttendance({ ...props });
  }

  public update(data: Partial<CreateEventAttendanceProps>): void {
    if (data.membersCount !== undefined && (!Number.isInteger(data.membersCount) || data.membersCount < 0)) {
      throw new ValidationError("INVALID_MEMBERS_COUNT");
    }
    if (data.visitorsCount !== undefined && (!Number.isInteger(data.visitorsCount) || data.visitorsCount < 0)) {
      throw new ValidationError("INVALID_VISITORS_COUNT");
    }

    let changed = false;
    const fields: (keyof CreateEventAttendanceProps)[] = ["membersCount", "visitorsCount"];
    for (const field of fields) {
      if (data[field] !== undefined && data[field] !== this.props[field]) {
        (this.props as any)[field] = data[field];
        changed = true;
      }
    }
    if (changed) this.props.updatedAt = new Date();
  }

  public get id() { return this.props.id; }
  public get eventId() { return this.props.eventId; }
  public get visitorsCount() { return this.props.visitorsCount; }
  public get membersCount() { return this.props.membersCount; }
  public get createdAt() { return this.props.createdAt; }
  public get updatedAt() { return this.props.updatedAt; }
}
