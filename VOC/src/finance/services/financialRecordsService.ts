import churchApi from "../../api/axios";
import { TransactionDirectionType } from "../../category/services/categoriesService";

// src/types/financialRecord.ts
export type Category = {
  id: string;
  name: string;
  type: TransactionDirectionType;
};

export type Member = {
  id: string;
  fullName: string;
  photoUrl: string | null;
};

export type Event = {
  id: string;
  title: string;
};

export type RecordedBy = {
  userId: string;
  fullname: string | null;
  memberId: string | null;
};

export type Audit = {
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  cancelReason?: string | null;
};

export type PaymentMethodType =
  | "CASH"
  | "PIX"
  | "CREDIT_CARD"
  | "BANK_TRANSFER";

export type CreateFinancialRecordInput = {
  amount: number;
  method: PaymentMethodType;
  date: Date;
  recordedById: string;
  categoryId: string;

  description?: string;
  memberId?: string;
  eventId?: string;
};

export type FinancialRecordDTO = {
  id: string;
  category: Category | null;
  amount: number;
  method: PaymentMethodType;
  date: string;
  direction: TransactionDirectionType;
  status: "ACTIVE" | "CANCELLED";
  description: string | null;

  member: { id: string; fullName: string; photoUrl: string } | null;
  event: { id: string; title: string | null } | null;

  recordedBy: {
    userId: string;
    fullName: string | null;
    memberId: string | null;
    roleName: string | null;
  };

  audit: {
    createdAt: Date;
    updatedAt: Date;
    cancelledAt: Date | null;
    cancelledById: string | null;
    cancelReason: string | null;
  };

  reversalOf: { id: string } | null;
  reversedBy: { id: string } | null;
};

export type FinancialRecordListItem = {
  id: string;
  amount: number;
  method: PaymentMethodType;
  date: string;
  direction: TransactionDirectionType;
  description?: string | null;
  status: "ACTIVE" | "CANCELLED";
  category: { id: string; name: string; type: TransactionDirectionType } | null;
  member?: { id: string; fullName: string } | null;
  event?: { id: string; title: string } | null;
  recordedBy: { id: string | null; fullName: string | null };
  createdAt: string;
  cancelledAt: string | null;
};

export const financialRecordsService = {
  create: async (data: CreateFinancialRecordInput) => {
    try {
      const response = await churchApi.post("/financial-records/", data);

      return response.data;
    } catch (error) {
      console.error("Erro no register:", error);
      throw error;
    }
  },

  find: async (recordId?: string) => {
    const response = await churchApi.get(`/financial-records/${recordId}`);
    return response.data;
  },

  fidByEvent: async (eventId?: string) => {
    const response = await churchApi.get(`/financial-records/event/${eventId}`);
    return response.data;
  },

  list: async (includeCancelled?: boolean): Promise<FinancialRecordListItem[]> => {
    const params = includeCancelled ? "?includeCancelled=true" : "";
    const response = await churchApi.get(`/financial-records/${params}`);

    return response.data;
  },

  update: async (financialRecordId: string, data: any) => {
    const response = await churchApi.patch(
      `/financial-records/${financialRecordId}`,
      data,
    );
    return response.data;
  },

  cancel: async (financialRecordId: string, reason: string) => {
    const response = await churchApi.patch(
      `/financial-records/${financialRecordId}/delete`,
      { reason },
    );
    return response.data;
  },

  reverse: async (financialRecordId: string, categoryId: string, reason: string) => {
    const response = await churchApi.post(
      `/financial-records/${financialRecordId}/reverse`,
      { categoryId, reason },
    );
    return response.data;
  },
};
