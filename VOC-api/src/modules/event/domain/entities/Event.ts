import { AttendanceMode, EventType } from "@prisma/client";
import { generateId } from "../../../../shared/utils/generateId";
import { ConflictError } from "../../../../shared/errors/ConflictError";
import { ValidationError } from "../../../../shared/errors/ValidationError";

export type EventProps = {
  id: string;
  title?: string | null;
  type: EventType;
  startsAt: Date;
  endsAt?: Date | null;
  preacherId?: string | null;
  theme?: string | null;
  notes?: string | null;
  needsScale: boolean;
  attendanceMode: AttendanceMode;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string | null;
  deletedAt?: Date | null;
  deletedById?: string | null;
  deleteReason?: string | null;
};

export type CreateEventProps = {
  title?: string | null;
  type: EventType;
  startsAt: Date;
  attendanceMode: AttendanceMode;
  needsScale?: boolean;
  createdById?: string | null;
  preacherId?: string | null;
  theme?: string | null;
  notes?: string | null;
};

export type UpdateEventProps = {
  title?: string | null;
  preacherId?: string | null;
  theme?: string | null;
  notes?: string | null;
};

export type FinishEventProps = {
  endsAt: Date;
};

export class Event {
  private constructor(private props: EventProps) {}

  public static create(data: CreateEventProps): Event {
    if (!data.type) throw new ValidationError("MISSING_EVENT_TYPE");
    if (!data.startsAt) throw new ValidationError("MISSING_STARTS_AT");

    const now = new Date();

    return new Event({
      id: generateId(),
      title: data.title ?? null,
      type: data.type,
      startsAt: data.startsAt,
      attendanceMode: data.attendanceMode,
      needsScale: data.needsScale ?? false,
      preacherId: data.preacherId ?? null,
      theme: data.theme ?? null,
      notes: data.notes ?? null,
      createdById: data.createdById ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  public static rehydrate(props: EventProps): Event {
    return new Event({ ...props });
  }

  public update(data: UpdateEventProps): void {
    if (this.props.deletedAt) {
      throw new ConflictError("EVENT_ALREADY_DELETED");
    }

    let changed = false;
    const fields: (keyof UpdateEventProps)[] = [
      "title", "preacherId", "theme", "notes",
    ];

    for (const field of fields) {
      if (data[field] !== undefined && data[field] !== this.props[field]) {
        (this.props as Record<string, unknown>)[field] = data[field];
        changed = true;
      }
    }

    if (changed) {
      this.props.updatedAt = new Date();
    }
  }

  public delete(deletedById: string, reason?: string) {
    if (this.props.deletedAt) {
      throw new ConflictError("EVENT_ALREADY_DELETED");
    }

    this.props.deletedAt = new Date();
    this.props.deletedById = deletedById;
    this.props.deleteReason = reason ?? null;
  }

  public finishEvent(data: FinishEventProps): void {
    if (this.props.deletedAt) {
      throw new ConflictError("EVENT_ALREADY_DELETED");
    }

    if (data.endsAt < this.props.startsAt) {
      throw new ValidationError("ENDS_AT_BEFORE_STARTS_AT");
    }

    this.props.endsAt = data.endsAt;
    this.props.updatedAt = new Date();
  }

  public get id() { return this.props.id; }
  public get title() { return this.props.title; }
  public get type() { return this.props.type; }
  public get attendanceMode() { return this.props.attendanceMode; }
  public get startsAt() { return this.props.startsAt; }
  public get endsAt() { return this.props.endsAt; }
  public get createdById() { return this.props.createdById; }
  public get preacherId() { return this.props.preacherId; }
  public get theme() { return this.props.theme; }
  public get notes() { return this.props.notes; }
  public get needsScale() { return this.props.needsScale; }
  public get createdAt() { return this.props.createdAt; }
  public get updatedAt() { return this.props.updatedAt; }
  public get deletedAt() { return this.props.deletedAt; }
  public get deletedById() { return this.props.deletedById; }
  public get deleteReason() { return this.props.deleteReason; }
  public get isDeleted(): boolean { return !!this.props.deletedAt; }
}
