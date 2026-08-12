import bcrypt from "bcrypt";
import { IHashProvider } from "../../domain/services/IHashProvider";

export class BcryptHashProvider implements IHashProvider {
  private readonly saltRounds = 12;

  async hash(plain: string): Promise<string> {
    if (!plain) {
      throw new Error("Password cannot be empty");
    }

    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
