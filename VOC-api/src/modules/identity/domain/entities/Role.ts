// identity/domain/entities/Role.ts
export type RoleProps = {
  id: string;
  name: string;
  level: number;
  description: string;
};

export class Role {
  private constructor(private props: RoleProps) {}

  public static create(props: RoleProps): Role {
    return new Role(props);
  }

  public get id() {
    return this.props.id;
  }
  public get name() {
    return this.props.name;
  }
  public get level() {
    return this.props.level;
  }
  public get description() {
    return this.props.description;
  }
}
