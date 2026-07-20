import { Request, Response } from "express";
import { CreateFinancialRecordUseCase } from "../../usecases/CreateFinancialRecordUseCase";
import { GetFinancialRecordByIdUseCase } from "../../usecases/GetFinancialRecordByIdUseCase";
import { ListFinancialRecordsUseCase } from "../../usecases/ListFinancialRecordsUseCase";
import { UpdateFinancialRecordUseCase } from "../../usecases/UpdateFinancialRecordUseCase";
import { DeleteFinancialRecordUseCase } from "../../usecases/DeleteFinancialRecordUseCase";
import { GetFinancialRecordsByEventUseCase } from "../../usecases/GetFinancialRecordsByEventUseCase";
import { ReverseFinancialRecordUseCase } from "../../usecases/ReverseFinancialRecordUseCase";

export class FinancialRecordController {
  constructor(
    private readonly createUseCase: CreateFinancialRecordUseCase,
    private readonly updateUseCase: UpdateFinancialRecordUseCase,
    private readonly getUseCase: GetFinancialRecordByIdUseCase,
    private readonly getByEventUseCase: GetFinancialRecordsByEventUseCase,
    private readonly listUseCase: ListFinancialRecordsUseCase,
    private readonly deleteUseCase: DeleteFinancialRecordUseCase,
    private readonly reverseUseCase: ReverseFinancialRecordUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    const payload = req.body;

    // Normalização de campos opcionais
    const normalizedPayload = {
      ...payload,
      memberId:
        payload.memberId && payload.memberId.trim() !== ""
          ? payload.memberId
          : null,

      eventId:
        payload.eventId && payload.eventId.trim() !== ""
          ? payload.eventId
          : null,
    };

    const result = await this.createUseCase.execute(normalizedPayload);

    return res.status(201).json(result);
  }
  async update(req: Request, res: Response): Promise<Response> {
    const recordId = String(req.params.recordId);

    const payload = { ...req.body, financialRecordId: recordId };

    await this.updateUseCase.execute(payload);

    return res.status(200).json({ message: "UPDATED_SUCCESSFULLY" });
  }

  async get(req: Request, res: Response): Promise<Response> {
    const recordId = String(req.params.recordId);
    const result = await this.getUseCase.execute({ recordId });

    return res.status(200).json(result);
  }
  async getByEvent(req: Request, res: Response): Promise<Response> {
    const eventId = String(req.params.eventId);
    const result = await this.getByEventUseCase.execute({ eventId });

    return res.status(200).json(result);
  }

  async list(req: Request, res: Response): Promise<Response> {
    const { limit, offset, includeCancelled } = req.query;
    const parsedLimit = limit ? Math.min(Math.max(Number(limit) || 50, 1), 200) : undefined;
    const parsedOffset = offset ? Math.max(Number(offset) || 0, 0) : undefined;
    const result = await this.listUseCase.execute({
      limit: parsedLimit,
      offset: parsedOffset,
      includeCancelled: includeCancelled === "true",
    });
    return res.status(200).json(result);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const recordId = String(req.params.recordId);
    const { reason } = req.body;

    await this.deleteUseCase.execute({
      financialRecordId: recordId,
      deletedById: req.auth!.userId,
      reason,
    });

    return res.status(200).json({ message: "DELETED_SUCCESSFULLY" });
  }

  async reverse(req: Request, res: Response): Promise<Response> {
    const recordId = String(req.params.recordId);
    const { categoryId, reason } = req.body;

    const result = await this.reverseUseCase.execute({
      financialRecordId: recordId,
      cancelledById: req.auth!.userId,
      categoryId,
      reason,
    });

    return res.status(200).json(result);
  }
}
