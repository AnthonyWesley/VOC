export interface ISiteTimezoneProvider {
  getTimezone(): Promise<string>;
}
