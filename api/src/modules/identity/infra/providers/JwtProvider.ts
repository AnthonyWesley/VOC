import jwt from "jsonwebtoken";
import { IJwtProvider, JwtPayload } from "../../domain/services/IJwtProvider";

export class JwtProvider implements IJwtProvider {
  private readonly secret: string;
  private readonly accessExpiresIn = "1d";
  private readonly refreshExpiresIn = "7d";

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    this.secret = secret;
  }

  signAccessToken(payload: object, expiresIn?: string): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn ?? this.accessExpiresIn } as any);
  }

  signRefreshToken(payload: object, expiresIn?: string): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn ?? this.refreshExpiresIn } as any);
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }
}
