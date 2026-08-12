export type JobTrigger = "cron" | "manual";

export type InactiveMembersProcessingSummary = {
  membersEvaluated: number;
  notificationsCreated: number;
  notificationsDeduplicated: number;
  whatsappAccepted: number;
  whatsappFailed: number;
};

export type RunInactiveMembersJobResult =
  | {
      status: "COMPLETED";
      trigger: JobTrigger;
      durationMs: number;
      membersEvaluated: number;
      notificationsCreated: number;
      notificationsDeduplicated: number;
      whatsappAccepted: number;
      whatsappFailed: number;
    }
  | {
      status: "SKIPPED";
      trigger: JobTrigger;
      reason: "JOB_ALREADY_RUNNING";
    };
