export type JwtPayload = {
  userId: string;
  userLevel: number;
  [key: string]: unknown;
};

export interface IJwtProvider {
  signAccessToken(payload: object, expiresIn: string): string;
  signRefreshToken(payload: object, expiresIn: string): string;
  verify(token: string): JwtPayload;
}
