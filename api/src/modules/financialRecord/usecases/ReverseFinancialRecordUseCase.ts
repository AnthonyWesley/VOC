import { FinancialRecord } from "../domain/entities/FinancialRecord";
import { IFinancialRecordRepository } from "../domain/repositories/IFinancialRecordRepository";
import { FinancialRecordUnitOfWork } from "../infra/unitOfWork";
import { ValidationError } from "../../../shared/errors/ValidationError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { ConflictError } from "../../../shared/errors/ConflictError";
import { DataIntegrityError } from "../../../shared/errors/DataIntegrityError";
import { isReversalUniqueConstraintError } from "../../../shared/utils/isReversalUniqueConstraintError";

export type ReverseFinancialRecordInput = {
  financialRecordId: string;
  reversedById: string;
  reason?: string;
};

export class ReverseFinancialRecordUseCase {
  constructor(
    private readonly uow: FinancialRecordUnitOfWork,
    private readonly repo: IFinancialRecordRepository,
  ) {}

  async execute(input: ReverseFinancialRecordInput) {
    const now = new Date();

    try {
      return await this.uow.execute(async ({ financialRecords }) => {
        const original = await financialRecords.findById(input.financialRecordId);
        if (!original) throw new NotFoundError("FINANCIAL_RECORD_NOT_FOUND");
        if (original.isReversal) throw new ConflictError("CANNOT_REVERSE_REVERSAL");

        // Idempotência: verifica se reversal já existe ANTES de estados
        const existing = await financialRecords.findByReversalOfId(original.id);
        if (existing) {
          if (!original.isReversed) {
            throw new DataIntegrityError("REVERSAL_EXISTS_BUT_ORIGINAL_IS_NOT_REVERSED");
          }
          return { originalId: original.id, reversalId: existing.id, alreadyReversed: true };
        }

        // Valida estado via entidade
        original.reverse(input.reversedById, input.reason, now);

        // Escrita condicional (compare-and-swap)
        const transitioned = await financialRecords.markAsReversedIfActive({
          id: original.id,
          reversedAt: original.reversedAt!,
          reversedById: original.reversedById!,
          reverseReason: original.reverseReason,
        });

        if (!transitioned) {
          const current = await financialRecords.findById(original.id);
          const existingAgain = await financialRecords.findByReversalOfId(original.id);

          if (existingAgain) {
            if (current?.isReversed) {
              return { originalId: original.id, reversalId: existingAgain.id, alreadyReversed: true };
            }
            throw new DataIntegrityError("REVERSAL_EXISTS_BUT_ORIGINAL_IS_NOT_REVERSED");
          }
          if (current?.isCancelled) throw new ConflictError("FINANCIAL_RECORD_ALREADY_CANCELLED");
          if (current?.isReversed) throw new DataIntegrityError("ORIGINAL_IS_REVERSED_WITHOUT_REVERSAL_RECORD");
          throw new ConflictError("FINANCIAL_RECORD_STATE_CHANGED");
        }

        // Cria reversal com direção oposta
        const oppositeDirection = original.direction === "INCOME" ? "EXPENSE" : "INCOME";
        const reversal = FinancialRecord.create({
          amount: original.amount,
          method: original.method,
          date: now,
          direction: oppositeDirection,
          recordedById: input.reversedById,
          categoryId: original.categoryId,
          description: `Estorno: ${original.description ?? "sem descrição"}`,
          memberId: original.memberId ?? undefined,
          eventId: original.eventId ?? undefined,
          reversalOfId: original.id,
        });

        await financialRecords.create(reversal);
        return { originalId: original.id, reversalId: reversal.id, status: "REVERSED" };
      });
    } catch (error) {
      // Captura violação única FORA da transação
      if (isReversalUniqueConstraintError(error)) {
        const [existing, current] = await Promise.all([
          this.repo.findByReversalOfId(input.financialRecordId),
          this.repo.findById(input.financialRecordId),
        ]);

        if (existing && current?.isReversed) {
          return { originalId: current.id, reversalId: existing.id, alreadyReversed: true };
        }

        if (existing && !current?.isReversed) {
          throw new DataIntegrityError("REVERSAL_EXISTS_BUT_ORIGINAL_IS_NOT_REVERSED");
        }
      }
      throw error;
    }
  }
}
