declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      userLevel?: number;
      roles?: { name: string; level: number }[];
    };
  }
}
