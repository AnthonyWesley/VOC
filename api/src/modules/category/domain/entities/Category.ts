// identity/domain/entities/User.ts

import { TransactionDirection } from "@prisma/client";
import { generateId } from "../../../../shared/utils/generateId";

export type CategoryProps = {
  id: string;
  name: string;
  type: TransactionDirection;
  createdAt: Date;
};

export class Category {
  private constructor(private props: CategoryProps) {}

  public static create(props: {
    name: string;
    type: TransactionDirection;
  }): Category {
    if (!props.name) {
      throw new Error("Name is required");
    }

    const now = new Date();

    return new Category({
      id: generateId(),
      name: props.name,
      type: props.type,
      createdAt: now,
    });
  }

  public static rehydrate(props: CategoryProps): Category {
    return new Category(props);
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get type(): TransactionDirection {
    return this.props.type;
  }
}
