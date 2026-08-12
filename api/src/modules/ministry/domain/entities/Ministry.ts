// identity/domain/entities/User.ts

import { generateId } from "../../../../shared/utils/generateId";

export type MinistryProps = {
  id: string;
  name: string;
  description?: string | null;
  leaderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export class Ministry {
  private constructor(private props: MinistryProps) {}

  // Factory
  public static create(props: {
    name: string;
    description?: string;
    leaderId?: string | null;
  }): Ministry {
    if (!props.name) {
      throw new Error("Name is required");
    }

    const now = new Date();

    return new Ministry({
      id: generateId(),
      name: props.name,
      description: props.description,
      leaderId: props.leaderId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  public static rehydrate(props: MinistryProps): Ministry {
    return new Ministry(props);
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | null {
    return this.props.description ?? null;
  }

  public get leaderId(): string | null {
    return this.props.leaderId ?? null;
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

  public get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  public delete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public restore(): void {
    this.props.deletedAt = null;
    this.props.updatedAt = new Date();
  }

  public update(props: { name?: string; description?: string | null }): void {
    if (props.name !== undefined) {
      if (!props.name?.trim()) {
        throw new Error("Name is required");
      }
      this.props.name = props.name.trim();
    }
    if (props.description !== undefined) {
      this.props.description = props.description;
    }
    this.props.updatedAt = new Date();
  }
}
