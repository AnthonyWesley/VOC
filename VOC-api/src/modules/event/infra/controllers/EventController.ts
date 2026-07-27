import { Request, Response } from "express";
import { z } from "zod";
import { CloseEventWithSummaryUseCase } from "../../usecases/CloseEventWithSummaryUseCase";
import { CancelEventUseCase } from "../../usecases/CancelEventUseCase";
import { CorrectEventUseCase } from "../../usecases/CorrectEventUseCase";
import { ListEventsUseCase } from "../../usecases/ListEventsUseCase";
import { DeleteEventUseCase } from "../../usecases/DeleteEventUseCase";
import { UpdateEventUseCase } from "../../usecases/UpdateEventUseCase";
import { GetEventDetailedUseCase } from "../../usecases/GetEventDetailedUseCase";
import { AssignMemberToEventUseCase } from "../../usecases/AssignMemberToEventUseCase";
import { RemoveMemberFromEventUseCase } from "../../usecases/RemoveMemberFromEventUseCase";
import { GetMonthlyEventReportUseCase } from "../../usecases/GetMonthlyEventReportUseCase";
import { EventType } from "@prisma/client";
import { listEventsHttpSchema } from "../../domain/validation/eventQuerySchemas";
import { monthlyReportHttpSchema } from "../../domain/validation/eventReportSchemas";

export class EventController {
  constructor(
    private readonly closeEventWithSummaryUseCase: CloseEventWithSummaryUseCase,
    private readonly getDetailedEventUseCase: GetEventDetailedUseCase,
    private readonly ListEventsUseCase: ListEventsUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    private readonly updateEventUseCase: UpdateEventUseCase,
    private readonly cancelEventUseCase: CancelEventUseCase,
    private readonly correctEventUseCase: CorrectEventUseCase,
    private readonly assignMemberToEventUseCase: AssignMemberToEventUseCase,
    private readonly removeMemberFromEventUseCase: RemoveMemberFromEventUseCase,
    private readonly getMonthlyEventReportUseCase: GetMonthlyEventReportUseCase,
  ) {}

  async create(request: Request, response: Response) {
    const schema = z.object({
      event: z.object({
        id: z.string().optional(),
        title: z.string().nullable().optional(),
        type: z.enum(["HOUSE_SERVICE", "SUNDAY_SERVICE", "PRAYER_MEETING", "BIBLE_STUDY", "YOUTH_NIGHT", "SPECIAL_EVENT"]),
        startsAt: z.string().datetime().or(z.date()),
        endsAt: z.string().datetime().or(z.date()).nullable().optional(),
        createdAt: z.string().datetime().or(z.date()).optional(),
        updatedAt: z.string().datetime().or(z.date()).optional(),
        preacherId: z.string().nullable().optional(),
        theme: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        needsScale: z.boolean().optional(),
      }),
      attendance: z.object({
        membersCount: z.number().int().min(0),
        visitorsCount: z.number().int().min(0),
      }).optional(),
      financialRecords: z.array(z.object({
        amount: z.number().positive(),
        method: z.any(),
        date: z.string().datetime().or(z.date()),
        categoryId: z.string().min(1),
        memberId: z.string().optional(),
        description: z.string().optional(),
        recordedById: z.string().min(1),
      })).optional(),
    });
    const parsed = schema.parse(request.body);
    const input = {
      event: {
        ...parsed.event,
        startsAt: new Date(parsed.event.startsAt),
        endsAt: parsed.event.endsAt ? new Date(parsed.event.endsAt) : undefined,
        attendanceMode: "SUMMARY" as const,
        createdById: request.auth!.userId,
      },
      attendance: parsed.attendance,
      financialRecords: parsed.financialRecords?.map((r) => ({
        ...r,
        date: new Date(r.date),
      })),
    } as Parameters<typeof this.closeEventWithSummaryUseCase.execute>[0];
    const output = await this.closeEventWithSummaryUseCase.execute(input);
    return response.status(201).json(output);
  }

  async get(request: Request, response: Response) {
    const eventId = String(request.params.eventId);
    const result = await this.getDetailedEventUseCase.execute({ eventId });
    return response.json(result);
  }

  async list(request: Request, response: Response): Promise<Response> {
    const parsed = listEventsHttpSchema.parse(request.query);

    const result = await this.ListEventsUseCase.execute(parsed);

    return response.status(200).json(result);
  }

  async update(request: Request, response: Response) {
    const eventId = String(request.params.eventId);
    const { title, preacherId, theme, notes } = request.body;

    await this.updateEventUseCase.execute({
      eventId,
      userId: request.auth!.userId,
      userLevel: request.auth!.userLevel ?? 0,
      title,
      preacherId,
      theme,
      notes,
    });

    return response.status(200).json({ message: "UPDATED_SUCCESSFULLY" });
  }

  async monthlyReport(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const parsed = monthlyReportHttpSchema.parse(request.query);
    const result = await this.getMonthlyEventReportUseCase.execute(parsed);
    return response.status(200).json(result);
  }

  async delete(request: Request, response: Response) {
    const eventId = String(request.params.eventId);
    const { reason } = request.body;

    await this.deleteEventUseCase.execute({
      eventId,
      deletedById: request.auth!.userId,
      userLevel: request.auth!.userLevel ?? 0,
      reason,
    });

    return response.status(204).send();
  }

  async assignMember(request: Request, response: Response): Promise<Response> {
    const eventId = String(request.params.eventId);

    const { memberId, ministryId } = request.body;

    const result = await this.assignMemberToEventUseCase.execute({
      eventId,
      memberId,
      ministryId,
      userId: request.auth!.userId,
      userLevel: request.auth!.userLevel ?? 0,
    });

    return response.status(200).json(result);
  }

  async removeMember(request: Request, response: Response): Promise<Response> {
    const eventId = String(request.params.eventId);
    const { memberId, assignmentId } = request.body;

    const result = await this.removeMemberFromEventUseCase.execute({
      eventId,
      memberId,
      assignmentId,
      userId: request.auth!.userId,
      userLevel: request.auth!.userLevel ?? 0,
    });

    return response.status(200).json(result);
  }

  async cancel(request: Request, response: Response): Promise<Response> {
    const eventId = String(request.params.eventId);
    const { reason } = request.body;

    const result = await this.cancelEventUseCase.execute({
      eventId,
      cancelledById: request.auth!.userId,
      reason,
    });

    return response.status(200).json(result);
  }

  async correct(request: Request, response: Response): Promise<Response> {
    const eventId = String(request.params.eventId);
    const { reason, theme, notes, preacherId, membersCount, visitorsCount } = request.body;

    const result = await this.correctEventUseCase.execute({
      eventId,
      correctedById: request.auth!.userId,
      reason,
      theme,
      notes,
      preacherId,
      membersCount,
      visitorsCount,
    });

    return response.status(200).json(result);
  }
}
