import { MemberStatus } from "@prisma/client";
import { generateId } from "../../../../shared/utils/generateId";

export type MemberProps = {
  id: string;
  fullName: string;
  normalizedFullName: string;
  nickname?: string | null;
  normalizedNickname?: string | null;
  birthDate: Date;
  phone?: string | null;
  postcode?: string | null;
  normalizedPostcode?: string | null;
  address?: string | null;
  baptismDate?: Date | null;
  churchJoinDate: Date;
  status: MemberStatus;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export class Member {
  private constructor(private props: MemberProps) {}

  // Factory
  public static create(props: {
    fullName: string;
    nickname?: string;
    birthDate: Date;
    phone?: string;
    postcode?: string;
    address?: string;
    baptismDate?: Date;
    churchJoinDate?: Date;
    userId?: string;
  }): Member {
    if (!props.fullName) {
      throw new Error("FullName is required");
    }

    const now = new Date();

    const normalizedFullName = props.fullName.trim().toLowerCase();
    const normalizedNickname = props.nickname?.trim().toLowerCase() ?? null;
    const normalizedPostcode =
      props.postcode?.replace(/\s+/g, "").toLowerCase() ?? null;

    return new Member({
      id: generateId(),
      fullName: props.fullName,
      normalizedFullName,
      nickname: props.nickname ?? null,
      normalizedNickname,
      birthDate: props.birthDate,
      phone: props.phone ?? null,
      postcode: props.postcode ?? null,
      normalizedPostcode,
      address: props.address ?? null,
      baptismDate: props.baptismDate ?? null,
      churchJoinDate: props.churchJoinDate ?? now,
      status: MemberStatus.ACTIVE,
      userId: props.userId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  // Rehydration (quando vem do banco)
  public static rehydrate(props: MemberProps): Member {
    return new Member(props);
  }

  public update(data: Partial<MemberProps>): void {
    let changed = false;

    const mutableFields: (keyof MemberProps)[] = [
      "fullName",
      "nickname",
      "birthDate",
      "phone",
      "postcode",
      "address",
      "baptismDate",
      "churchJoinDate",
      "status",
      "userId",
    ];

    for (const field of mutableFields) {
      if (data[field] !== undefined && data[field] !== this.props[field]) {
        (this.props as Record<string, unknown>)[field] = data[field];
        changed = true;
      }
    }

    // Recalcular normalizações quando necessário
    if (data.fullName !== undefined) {
      this.props.normalizedFullName = data.fullName.trim().toLowerCase();
      changed = true;
    }

    if (data.nickname !== undefined) {
      this.props.normalizedNickname = data.nickname?.trim().toLowerCase() ?? null;
      changed = true;
    }

    if (data.postcode !== undefined) {
      this.props.normalizedPostcode =
        data.postcode?.replace(/\s+/g, "").toLowerCase() ?? null;
      changed = true;
    }

    if (changed) {
      this.props.updatedAt = new Date();
    }
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get fullName(): string {
    return this.props.fullName;
  }

  public get normalizedFullName(): string {
    return this.props.normalizedFullName;
  }

  public get nickname(): string | null {
    return this.props.nickname ?? null;
  }

  public get normalizedNickname(): string | null {
    return this.props.normalizedNickname ?? null;
  }

  public get status(): MemberStatus {
    return this.props.status;
  }

  public get phone(): string | null {
    return this.props.phone ?? null;
  }

  public get birthDate(): Date {
    return this.props.birthDate;
  }

  public get postcode(): string | null {
    return this.props.postcode ?? null;
  }

  public get normalizedPostcode(): string | null {
    return this.props.normalizedPostcode ?? null;
  }

  public get address(): string | null {
    return this.props.address ?? null;
  }

  public get baptismDate(): Date | null {
    return this.props.baptismDate ?? null;
  }

  public get churchJoinDate(): Date {
    return this.props.churchJoinDate;
  }

  public get userId(): string | null {
    return this.props.userId ?? null;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  public delete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }
}
