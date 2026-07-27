export type AcquireLeaseInput = {
  name: string;
  ownerId: string;
  ttlSeconds: number;
};

export type AcquireLeaseResult =
  | { acquired: true }
  | { acquired: false };

export type JobLeaseStatus = {
  running: boolean;
  lockedUntil: Date | null;
};

export interface IJobLeaseRepository {
  tryAcquire(input: AcquireLeaseInput): Promise<AcquireLeaseResult>;
  release(name: string, ownerId: string): Promise<void>;
  renew(name: string, ownerId: string, ttlSeconds: number): Promise<boolean>;
  getStatus(name: string): Promise<JobLeaseStatus>;
}
