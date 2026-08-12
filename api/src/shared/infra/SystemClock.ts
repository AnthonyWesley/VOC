import { IClock } from "../application/IClock";

export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
