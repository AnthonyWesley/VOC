import { ISiteTimezoneProvider } from "../../../site-content/domain/ISiteTimezoneProvider";
import { IClock } from "../../../shared/application/IClock";
import { IEventReportRepository } from "../domain/repositories/IEventReportRepository";
import { monthlyReportInputSchema } from "../domain/validation/eventReportSchemas";
import { getYearMonthInTimeZone } from "../domain/utils/zonedDateTime";
import { assertValidTimeZone } from "../domain/utils/timeZoneValidation";

export class GetMonthlyEventReportUseCase {
  constructor(
    private readonly eventReportRepository: IEventReportRepository,
    private readonly timezoneProvider: ISiteTimezoneProvider,
    private readonly clock: IClock,
  ) {}

  async execute(input: unknown) {
    const parsed = monthlyReportInputSchema.parse(input);

    const timezone = await this.timezoneProvider.getTimezone();
    assertValidTimeZone(timezone);

    const needsCurrentDate = parsed.month === undefined || parsed.year === undefined;
    const current = needsCurrentDate ? getYearMonthInTimeZone(this.clock.now(), timezone) : null;

    const month = parsed.month ?? current!.month;
    const year = parsed.year ?? current!.year;

    return this.eventReportRepository.getMonthlyReport({
      month,
      year,
      type: parsed.type,
      timezone,
    });
  }
}
