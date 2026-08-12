import { generateId } from "../../../../shared/utils/generateId";

export type RefreshTokenProps = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export class RefreshToken {
  private constructor(private props: RefreshTokenProps) {}

  static create(userId: string, tokenHash: string, expiresAt: Date) {
    return new RefreshToken({
      id: generateId(),
      userId,
      tokenHash,
      expiresAt,
      createdAt: new Date(),
    });
  }

  static rehydrate(props: RefreshTokenProps) {
    return new RefreshToken(props);
  }

  isExpired() {
    return this.props.expiresAt.getTime() < Date.now();
  }

  get id() {
    return this.props.id;
  }

  get userId() {
    return this.props.userId;
  }

  get tokenHash() {
    return this.props.tokenHash;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }
}
