import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Balloon } from "../../components/Balloon";
import Avatar from "../../components/Avatar";

import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import useFinancialRecord from "../hooks/useFinancialRecord";
import FinancialRecordForm from "../components/FinancialRecordForm";
import { currencyFormatter } from "../../helpers/currencyFormatter";
import { PageHeader } from "../../components/PageHeader";
import { downloadPdf } from "../../pdf/download";
import FinancialReceipt from "../../pdf/documents/FinancialReceipt";
import type { ReceiptPdfData } from "../../pdf/types";
import { useFinancialRecordMutations } from "../hooks/useFinancialRecordMutations";
import { LEVEL } from "../../shared/constants/levels";
import useAuthStatus from "../../auth/hooks/useAuthStatus";

export default function FinancialRecordDetailsPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { authLevel } = useAuthStatus();
  const { cancelFinancialRecord, reverseFinancialRecord } = useFinancialRecordMutations();

  const {
    queryRecord: { data: record, isLoading, error },
  } = useFinancialRecord(recordId!);

  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [reverseReason, setReverseReason] = useState("");
  const [showReverseModal, setShowReverseModal] = useState(false);

  if (isLoading) {
    return <p className="text-gray-300">Carregando registro...</p>;
  }

  if (error || !record) {
    return <p className="text-red-400">Registro financeiro não encontrado.</p>;
  }

  const status = record.status ?? (record.audit.cancelledAt ? "CANCELLED" : "ACTIVE");
  const isCancelled = status === "CANCELLED";
  const isReversed = status === "REVERSED";
  const isOutflow = record.category?.type === "EXPENSE";

  const date = new Date(record.date).toLocaleString("pt-BR");
  const createdAt = new Date(record.audit.createdAt).toLocaleString("pt-BR");
  const updatedAt = new Date(record.audit.updatedAt).toLocaleString("pt-BR");

  const categoryName = record.category?.name ?? "Sem categoria";
  const memberName = record.member?.fullName ?? "Não vinculado";
  const eventTitle = record.event?.title ?? "Evento não informado";
  const recordedBy = record.recordedBy.fullName ?? "Usuário desconhecido";
  const recordedByRole = record.recordedBy.roleName ?? undefined;

  const handleCancel = () => {
    cancelFinancialRecord.mutate(
      { financialRecordId: record.id, reason: cancelReason },
      { onSuccess: () => setShowCancelModal(false) },
    );
  };

  const handleReverse = () => {
    reverseFinancialRecord.mutate(
      {
        financialRecordId: record.id,
        reason: reverseReason,
      },
      { onSuccess: () => setShowReverseModal(false) },
    );
  };

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon={
          isOutflow ? "mdi:arrow-down-bold-circle" : "mdi:arrow-up-bold-circle"
        }
        title="Detalhes Financeiros"
        subtitle="Informações completas do lançamento"
        back
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
      />

      <div className="mx-auto max-w-3xl space-y-8">
        {/* CARD PRINCIPAL */}
        <div className="card-premium p-6">
          {/* HEADER */}
          <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end">
            <div className="flex items-center gap-3">
              <div>
                <span
                  className={`text-xs font-bold tracking-widest uppercase ${
                    isOutflow ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {isOutflow ? "Saída" : "Entrada"}
                </span>

                <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
                  {categoryName}
                </h1>
              </div>
              {isCancelled && (
                <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                  Cancelado
                </span>
              )}
              {isReversed && (
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                  Estornado
                </span>
              )}
              {record.reversalOf && (
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
                  Estorno
                </span>
              )}
            </div>

            <div className="text-right">
              <p
                className={`font-mono text-3xl font-bold ${
                  isOutflow ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {isOutflow ? "- " : "+ "}
                {currencyFormatter.format(record.amount)}
              </p>
            </div>
          </div>

          {/* INFORMAÇÕES */}
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
              <Icon icon="mdi:information-outline" scale={0.9} />
              Informações da Transação
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
              <Info label="Data do Movimento" value={date} />
              <Info label="Método de Pagamento" value={record.method} />
              <Info
                label="Descrição"
                value={record.description ?? "Sem descrição"}
              />
              <Info
                label="ID do Registro"
                value={
                  <span className="font-mono text-[10px] text-gray-500 uppercase">
                    {record.id}
                  </span>
                }
              />
            </div>
          </div>

          {/* RELACIONAMENTOS */}
          {(record.member || record.event || record.reversalOf || record.reversedBy) && (
            <Balloon className="mt-8" offset={40}>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Relacionamentos
              </h2>

              <div className="mt-4 space-y-6">
                {record.member && (
                  <RelationItem
                    icon={
                      <Avatar
                        name={memberName}
                        size="40"
                        className="rounded-full bg-gray-800"
                      />
                    }
                    label="Membro Vinculado"
                    value={memberName}
                  />
                )}

                {record.event && (
                  <RelationItem
                    icon={
                      <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-gray-800 text-gray-400">
                        <Icon icon="mdi:calendar-check" scale={1} />
                      </div>
                    }
                    label="Evento / Culto"
                    value={eventTitle}
                    border
                  />
                )}

                {record.reversalOf && (
                  <RelationItem
                    icon={
                      <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                        <Icon icon="mdi:swap-horizontal-bold" scale={1} />
                      </div>
                    }
                    label="Estorno do registro"
                    value={
                      <button
                        onClick={() => navigate(`/finance/${record.reversalOf!.id}`)}
                        className="text-indigo-400 underline hover:text-indigo-300"
                      >
                        {record.reversalOf.id.slice(0, 8)}
                      </button>
                    }
                    border
                  />
                )}

                {record.reversedBy && (
                  <RelationItem
                    icon={
                      <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                        <Icon icon="mdi:swap-horizontal-bold" scale={1} />
                      </div>
                    }
                    label="Estornado por"
                    value={
                      <button
                        onClick={() => navigate(`/finance/${record.reversedBy!.id}`)}
                        className="text-indigo-400 underline hover:text-indigo-300"
                      >
                        {record.reversedBy.id.slice(0, 8)}
                      </button>
                    }
                    border
                  />
                )}
              </div>
            </Balloon>
          )}

          {/* AUDITORIA */}
          <Balloon className="mt-8" offset={40}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Registro e Auditoria
            </h2>

            <RelationItem
              icon={
                <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                  <Icon icon="mdi:account-cash" scale={1} />
                </div>
              }
              label="Registrado por"
              value={recordedBy}
            />

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
              <Info label="Criado em" value={createdAt} />
              <Info label="Última atualização" value={updatedAt} />
            </div>

            {isCancelled && (
              <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3">
                <p className="text-xs font-bold text-red-400 uppercase">
                  Registro Cancelado
                </p>
                <p className="mt-1 text-sm text-red-200">
                  {record.audit.cancelReason ?? "Sem motivo informado"}
                </p>
              </div>
            )}
          </Balloon>

          {/* AÇÕES */}
          <div className="mt-8 space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const data: ReceiptPdfData = {
                    organization: {
                      name: "VOC Church",
                      document: "",
                    },
                    transaction: {
                      id: record.id,
                      type: record.category?.type === "EXPENSE" ? "EXPENSE" : "INCOME",
                      category: categoryName,
                      amount: Number(record.amount),
                      date: new Date(record.date),
                      method: record.method,
                      description: record.description ?? undefined,
                      memberName: record.member?.fullName ?? undefined,
                      eventName: record.event?.title ?? undefined,
                      recordedBy: recordedBy,
                      recordedByRole: recordedByRole,
                      status: isCancelled ? "cancelled" : "active",
                      cancelReason: record.audit.cancelReason ?? undefined,
                    },
                    audit: {
                      documentId: record.id.slice(0, 8).toUpperCase(),
                      createdAt: new Date(record.audit.createdAt),
                      generatedAt: new Date(),
                      hash: record.id,
                    },
                  };
                  downloadPdf(
                    <FinancialReceipt data={data} />,
                    `comprovante-${record.id.slice(0, 8)}`,
                  );
                }}
                className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-400 transition-colors hover:bg-purple-500/30"
              >
                Exportar PDF
              </button>
            </div>

            {!isCancelled && !isReversed && !record.reversalOf && authLevel >= LEVEL.TREASURER && (
              <div className="relative flex flex-wrap gap-2 pt-4">
                <div className="flex flex-wrap gap-2">
                  <Modal
                    id={`editRecordModal-${record.id}`}
                    icon="mdi:pencil"
                    info="Editar lançamento"
                    scale={0.8}
                  >
                    <FinancialRecordForm record={record} />
                  </Modal>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex items-center gap-1 rounded-lg bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-600/30"
                  >
                    <Icon icon="mdi:cancel" scale={0.8} />
                    <span>Cancelar</span>
                  </button>

                  <button
                    onClick={() => setShowReverseModal(true)}
                    className="flex items-center gap-1 rounded-lg bg-amber-600/20 px-3 py-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-600/30"
                  >
                    <Icon icon="mdi:swap-horizontal-bold" scale={0.8} />
                    <span>Estornar</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 rounded-lg bg-gray-600/20 px-3 py-2 text-xs font-semibold text-gray-400 transition-colors hover:bg-gray-600/30"
                  >
                    <Icon icon="mdi:printer" scale={0.8} />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CANCELAMENTO */}
      <dialog
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box bg-gray-900 text-gray-200">
          <h3 className="text-lg font-bold text-white">Cancelar lançamento</h3>
          <p className="py-2 text-sm text-gray-400">
            O registro será marcado como cancelado. Informe o motivo:
          </p>

          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo do cancelamento..."
            className="textarea textarea-bordered mt-2 w-full bg-gray-800 text-gray-200"
            rows={3}
          />

          <div className="modal-action">
            <button
              onClick={() => setShowCancelModal(false)}
              className="btn btn-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Voltar
            </button>
            <button
              onClick={handleCancel}
              disabled={!cancelReason.trim() || cancelFinancialRecord.isPending}
              className="btn btn-sm bg-red-600 text-white hover:bg-red-500 disabled:opacity-40"
            >
              {cancelFinancialRecord.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
            </button>
          </div>
        </div>
      </dialog>

      {/* MODAL DE ESTORNO */}
      <dialog
        open={showReverseModal}
        onClose={() => setShowReverseModal(false)}
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box bg-gray-900 text-gray-200">
          <h3 className="text-lg font-bold text-white">Estornar lançamento</h3>
          <p className="py-2 text-sm text-gray-400">
            O registro original será cancelado e um novo registro de estorno será criado.
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-gray-400">Motivo do estorno</label>
              <textarea
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="Descreva o motivo do estorno..."
                className="textarea textarea-bordered mt-1 w-full bg-gray-800 text-gray-200"
                rows={3}
              />
            </div>
          </div>

          <div className="modal-action">
            <button
              onClick={() => setShowReverseModal(false)}
              className="btn btn-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Voltar
            </button>
            <button
              onClick={handleReverse}
              disabled={
                !reverseReason.trim() ||
                reverseFinancialRecord.isPending
              }
              className="btn btn-sm bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40"
            >
              {reverseFinancialRecord.isPending ? "Estornando..." : "Confirmar Estorno"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function RelationItem({
  icon,
  label,
  value,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 ${border ? "border-t border-white/5 pt-4" : ""}`}
    >
      {icon}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <div className="font-medium text-[var(--text-primary)]">{value}</div>
      </div>
    </div>
  );
}
