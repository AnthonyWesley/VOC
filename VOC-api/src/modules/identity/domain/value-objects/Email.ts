// identity/domain/value-objects/Email.ts
export class Email {
  private constructor(private readonly value: string) {}

  public static create(email: string): Email {
    if (!email) {
      throw new Error("Email is required");
    }

    const normalized = email.trim().toLowerCase();

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(normalized)) {
      throw new Error("Invalid email format");
    }

    return new Email(normalized);
  }

  public getValue(): string {
    return this.value;
  }
}
