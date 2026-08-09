export const MINIMUM_EVENT_ADMIN_LEVEL = 80;

export interface IEventAdminRecipientReader {
  findEventAdminUserIds(): Promise<string[]>;
}
