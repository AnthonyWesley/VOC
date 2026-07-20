export interface OrganizationInfo {
  name: string;
  document: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface AuditInfo {
  documentId: string;
  createdAt: Date;
  generatedAt: Date;
  hash?: string;
  createdBy?: string;
  createdByRole?: string;
}

export interface TransactionData {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  date: Date;
  method: string;
  description?: string;
  memberName?: string;
  eventName?: string;
  recordedBy?: string;
  recordedByRole?: string;
  status?: "active" | "cancelled";
  cancelReason?: string;
}

export interface FinancialSummaryData {
  income: number;
  expense: number;
  balance: number;
  totalTransactions: number;
  byCategory?: Array<{ name: string; direction: string; total: number }>;
  byMethod?: Array<{ method: string; total: number }>;
}

export interface EventData {
  id: string;
  title?: string;
  type: string;
  startsAt: Date;
  endsAt?: Date;
  theme?: string;
  notes?: string;
  preacherName?: string;
  membersCount: number;
  visitorsCount: number;
  members?: Array<{ name: string }>;
  assignments?: Array<{ memberName: string; ministry: string; description?: string }>;
  financialRecords?: Array<{ category: string; direction: string; amount: number; method: string; recordedBy?: string; recordedByRole?: string }>;
  financialSummary?: { income: number; expense: number; balance: number };
}

export interface ReceiptPdfData {
  organization: OrganizationInfo;
  transaction: TransactionData;
  audit: AuditInfo;
}

export interface FinancialReportPdfData {
  organization: OrganizationInfo;
  period: { month: number; year: number };
  summary: FinancialSummaryData;
  records: TransactionData[];
  audit: AuditInfo;
}

export interface EventReportPdfData {
  organization: OrganizationInfo;
  event: EventData;
  audit: AuditInfo;
}
