// identity/domain/entities/User.ts

import { ForbiddenError } from "../../../../shared/errors/ForbiddenError";
import { generateId } from "../../../../shared/utils/generateId";
import { MemberProps } from "../../../membership/domain/entities/Member";
import { Email } from "../value-objects/Email";

export type UserRole = {
  id: string;
  name: string;
  level: number;
};

export type UserProps = {
  id: string;
  email: Email;
  passwordHash: string;
  photoUrl?: string | null;
  photoPublicId?: string | null;
  isActive: boolean;
  isTemporaryPassword: boolean;
  temporaryPasswordExpiresAt: Date | null;
  passwordChangedAt: Date | null;
  roles: UserRole[];
  member?: MemberProps;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  private constructor(private props: UserProps) {}

  // Factory
  public static create(props: { email: Email; passwordHash: string; temporaryPasswordExpiresAt?: Date | null }): User {
    if (!props.passwordHash) {
      throw new Error("Password hash is required");
    }

    const now = new Date();

    return new User({
      id: generateId(),
      email: props.email,
      passwordHash: props.passwordHash,
      isActive: true,
      isTemporaryPassword: true,
      temporaryPasswordExpiresAt: props.temporaryPasswordExpiresAt ?? null,
      passwordChangedAt: null,
      roles: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  // Rehydration
  public static rehydrate(props: UserProps): User {
    return new User(props);
  }

  // Behavior
  public deactivate(): void {
    if (!this.props.isActive) {
      throw new Error("User already inactive");
    }
    this.props.isActive = false;
    this.touch();
  }

  public activate(): void {
    if (this.props.isActive) {
      throw new Error("User already active");
    }
    this.props.isActive = true;
    this.touch();
  }

  public hasRoleLevelGreaterOrEqual(level: number): boolean {
    return this.props.roles.some((r) => r.level >= level);
  }

  public assignRole(role: UserRole, assignedBy: User): void {
    if (!assignedBy.hasRoleLevelGreaterOrEqual(role.level)) {
      throw new ForbiddenError("INSUFFICIENT_PERMISSION_TO_ASSIGN_ROLE");
    }

    if (this.props.roles.some((r) => r.id === role.id)) {
      return; // idempotência silenciosa
    }

    this.props.roles.push(role);
    this.touch();
  }

  public removeRole(roleName: string): void {
    this.props.roles = this.props.roles.filter((r) => r.name !== roleName);
    this.touch();
  }

  public updateEmail(email: Email): void {
    this.props.email = email;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public markPasswordAsPermanent(): void {
    this.props.isTemporaryPassword = false;
    this.props.temporaryPasswordExpiresAt = null;
    this.props.passwordChangedAt = new Date();
    this.touch();
  }

  public markPasswordAsTemporary(passwordHash: string, expiresAt: Date): void {
    this.props.passwordHash = passwordHash;
    this.props.isTemporaryPassword = true;
    this.props.temporaryPasswordExpiresAt = expiresAt;
    this.props.passwordChangedAt = null;
    this.touch();
  }

  public updatePassword(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
    this.touch();
  }

  // Helpers
  public hasRole(roleName: string): boolean {
    return this.props.roles.some((r) => r.name === roleName);
  }

  public get highestLevel(): number {
    return Math.max(...this.props.roles.map((r) => r.level), 0);
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get email(): string {
    return this.props.email.getValue();
  }

  public get photoUrl(): string | null {
    return this.props.photoUrl || null;
  }

  public get photoPublicId(): string | null {
    return this.props.photoPublicId || null;
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public get isTemporaryPassword(): boolean {
    return this.props.isTemporaryPassword;
  }

  public get temporaryPasswordExpiresAt(): Date | null {
    return this.props.temporaryPasswordExpiresAt;
  }

  public get passwordChangedAt(): Date | null {
    return this.props.passwordChangedAt;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get member(): MemberProps | null {
    return this.props.member || null;
  }

  public get roles(): UserRole[] {
    return [...this.props.roles];
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
