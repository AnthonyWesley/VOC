// identity/domain/entities/User.ts

import { generateId } from "../../../../shared/utils/generateId";

export type MinistryProps = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Ministry {
  private constructor(private props: MinistryProps) {}

  // Factory
  public static create(props: {
    name: string;
    description?: string;
  }): Ministry {
    if (!props.name) {
      throw new Error("Name is required");
    }

    const now = new Date();

    return new Ministry({
      id: generateId(),
      name: props.name,
      description: props.description,
      createdAt: now,
      updatedAt: now,
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

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
