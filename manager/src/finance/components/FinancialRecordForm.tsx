import { useEffect, useState, useMemo } from "react";
import { useFinancialRecordMutations } from "../hooks/useFinancialRecordMutations";
import { currencyFormatter } from "../../helpers/currencyFormatter";

import CategorySelector from "../../category/components/CategorySelector";
import MemberSelector from "../../member/components/MemberSelector";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { FinancialRecordDTO } from "../services/financialRecordsService";
import { toast } from "react-toastify";
import { FormInput } from "../../components/FormInput";
import { PageHeader } from "../../components/PageHeader";
import Card from "../../components/Card";
import { FormButton } from "../../components/FormButton";

type Props = {
  eventId?: string;
  record?: FinancialRecordDTO;
};

export default function FinancialRecordForm({ eventId, record }: Props) {
  const { createFinancialRecord, updateFinancialRecord } =
    useFinancialRecordMutations();
  const { authUserId } = useAuthStatus();

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const [transactionType, setTransactionType] = useState<"INCOME" | "EXPENSE">(
    record?.category?.type ?? "INCOME",
  );

  const [form, setForm] = useState({
    amount: currencyFormatter.toNumber(record?.amount ?? 0),
    method: record?.method ?? "PIX",
    date: record?.date
      ? new Date(record.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    categoryId: record?.category?.id ?? "",
    description: record?.description ?? "",
    memberId: record?.member?.id ?? "",
    eventId: record?.event?.id ?? eventId,
    recordedById: authUserId ?? "",
  });

  const [errors, setErrors] = useState<any>({});

  const loading =
    createFinancialRecord.isPending || updateFinancialRecord.isPending;

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Preenche selects ao editar
  useEffect(() => {
    if (record?.category) {
      setSelectedCategory({
        id: record.category.id,
        name: record.category.name,
        type: record.category.type,
      });
      setTransactionType(record.category.type);
    }
    if (record?.member) {
      setSelectedMember({
        id: record.member.id,
        fullName: record.member.fullName,
        photoUrl: record.member.photoUrl,
      });
    }
  }, [record]);

  // Detecta mudanças
  const hasChanges = useMemo(() => {
    if (!record) return true;
    return (
      form.categoryId !== record.category?.id ||
      form.memberId !== record.member?.id ||
      form.eventId !== record.event?.id ||
      form.description !== record.description
    );
  }, [form, record]);

  const validate = () => {
    const newErrors: any = {};
    const amount = currencyFormatter.toNumber(form.amount);

    if (!amount || amount <= 0) {
      newErrors.amount = "O valor deve ser maior que zero.";
    }

    if (!form.categoryId) {
      newErrors.categoryId = "Selecione uma categoria.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      toast.info("Nenhuma alteração detectada.");
      return;
    }

    if (!validate()) return;

    const amount = currencyFormatter.toNumber(form.amount);
    const payload = { ...form, amount };

    if (record?.id) {
      await updateFinancialRecord.mutateAsync({
        financialRecordId: record.id,
        data: {
          ...payload,
          date: new Date(form.date),
        },
      });
    } else {
      await createFinancialRecord.mutateAsync({
        ...payload,
        date: new Date(),
      });
    }
  };

  const isReadOnly = !!record;

  return (
    <Card>
      <PageHeader
        icon="mdi:cash-multiple"
        title="Novo Registro Financeiro"
        subtitle="Informações pessoais e permissões"
      />
      <form
        onSubmit={handleSubmit}
        className="max-h-[75vh] space-y-2 overflow-y-auto p-5"
      >
        {/* Tipo */}
        <FormInput
          label="Tipo da Transação"
          icon="mdi:swap-horizontal"
          type="select"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as any)}
          disabled={isReadOnly}
          options={[
            { label: "Entrada", value: "INCOME" },
            { label: "Saída", value: "EXPENSE" },
          ]}
        />

        {/* Transação */}
        <section className="border-t border-gray-500/15 pt-2">
          <h2 className="mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">
            Transação
          </h2>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {/* Amount */}
            <FormInput
              label="Valor"
              icon="mdi:currency-usd"
              type="currency-gbp"
              value={form.amount} // valor cru (number ou string)
              onValueChange={(val) =>
                handleChange("amount", currencyFormatter.toNumber(val))
              }
              className={errors.amount ? "border-red-500" : ""}
              disabled={isReadOnly}
            />

            {errors.amount && (
              <p className="text-error mt-1 text-xs">{errors.amount}</p>
            )}

            {/* Method */}
            <FormInput
              label="Método"
              icon="mdi:credit-card-outline"
              type="select"
              value={form.method}
              onChange={(e) => handleChange("method", e.target.value)}
              disabled={isReadOnly}
              options={[
                { label: "PIX", value: "PIX" },
                { label: "Dinheiro", value: "CASH" },
                { label: "Cartão", value: "CREDIT_CARD" },
                { label: "Transferência", value: "BANK_TRANSFER" },
              ]}
            />

            {/* Date */}
            <FormInput
              label="Data"
              icon="mdi:calendar"
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </section>

        {/* Categoria */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <CategorySelector
            value={selectedCategory}
            type={transactionType}
            onChange={(cat) => {
              setSelectedCategory(cat);
              handleChange("categoryId", cat.id);
            }}
          />

          {errors.categoryId && (
            <p className="text-error mt-1 text-xs">{errors.categoryId}</p>
          )}

          {/* Membro */}

          <MemberSelector
            value={selectedMember}
            onChange={(m) => {
              setSelectedMember(m);
              handleChange("memberId", m.id);
            }}
          />
        </div>

        {/* Descrição */}
        <FormInput
          label="Descrição"
          icon="mdi:text"
          type="textarea"
          rows={3}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />

        {/* Submit */}

        <FormButton
          type="submit"
          label="Salvar"
          icon="mdi:content-save"
          isPending={loading}
          disabled={!hasChanges}
        />
      </form>
    </Card>
  );
}
