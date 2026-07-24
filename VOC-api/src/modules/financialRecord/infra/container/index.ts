import { prisma } from "../../../../package/prisma";
import { PrismaFinancialRecordRepository } from "../../domain/repositories/PrismaFinancialRecordRepository";
import { PrismaCategoryRepository } from "../../../category/domain/repositories/PrismaCategoryRepository";
import { CreateFinancialRecordUseCase } from "../../usecases/CreateFinancialRecordUseCase";
import { DeleteFinancialRecordUseCase } from "../../usecases/DeleteFinancialRecordUseCase";
import { GetFinancialRecordByIdUseCase } from "../../usecases/GetFinancialRecordByIdUseCase";
import { GetFinancialRecordsByEventUseCase } from "../../usecases/GetFinancialRecordsByEventUseCase";
import { ListFinancialRecordsUseCase } from "../../usecases/ListFinancialRecordsUseCase";
import { UpdateFinancialRecordUseCase } from "../../usecases/UpdateFinancialRecordUseCase";
import { ReverseFinancialRecordUseCase } from "../../usecases/ReverseFinancialRecordUseCase";
import { PrismaFinancialRecordUnitOfWork } from "../unitOfWork";
import { FinancialRecordController } from "../controllers/FinancialRecordController";

const financialRecordRepository = new PrismaFinancialRecordRepository(prisma);
const categoryRepository = new PrismaCategoryRepository(prisma);
const unitOfWork = new PrismaFinancialRecordUnitOfWork(prisma);

const create = new CreateFinancialRecordUseCase(financialRecordRepository, categoryRepository);
const update = new UpdateFinancialRecordUseCase(financialRecordRepository);
const get = new GetFinancialRecordByIdUseCase(financialRecordRepository);
const getByEvent = new GetFinancialRecordsByEventUseCase(financialRecordRepository);
const list = new ListFinancialRecordsUseCase(financialRecordRepository);
const softDelete = new DeleteFinancialRecordUseCase(financialRecordRepository);
const reverse = new ReverseFinancialRecordUseCase(unitOfWork, financialRecordRepository);

export const financialRecordController = new FinancialRecordController(
  create,
  update,
  get,
  getByEvent,
  list,
  softDelete,
  reverse,
);
