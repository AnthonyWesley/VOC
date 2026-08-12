import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { FormValidator } from "../../helpers/FormValidator";
import { useCategoryMutations } from "../hooks/useCategoryMutations";
import { TransactionDirectionType } from "../services/categoriesService";

import { PageHeader } from "../../components/PageHeader";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";

type CategoryFormProps = {
  category?: {
    id: string;
    name: string;
    type: TransactionDirectionType;
  };
};

export default function CategoryForm({ category }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionDirectionType>("INCOME");

  const { upsertCategory } = useCategoryMutations();

  useEffect(() => {
    if (!category) return;

    setName(category.name);
    setType(category.type);
  }, [category]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isValid = FormValidator.validateAll({ name });
    if (!isValid) return;

    upsertCategory.mutate({
      id: category?.id,
      name,
      type,
    });
  };

  return (
    <Card className="overflow-hidden p-0">
      {/* 🔥 Header reutilizável */}
      <PageHeader
        icon={category ? "mdi:tag-edit" : "mdi:tag-plus"}
        title={category ? "Editar Categoria" : "Nova Categoria"}
        subtitle="Organize suas transações por categoria"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        {/* Nome */}
        <FormInput
          label="Nome"
          icon="mdi:label-outline"
          type="text"
          placeholder="Nome da categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Tipo */}
        <FormInput
          label="Tipo"
          icon="mdi:swap-horizontal"
          type="select"
          value={type}
          onChange={(e) => setType(e.target.value as TransactionDirectionType)}
          options={[
            { label: "Entrada", value: "INCOME" },
            { label: "Saída", value: "EXPENSE" },
          ]}
        />

        <FormButton
          type="submit"
          label="Salvar"
          icon="mdi:content-save"
          isPending={upsertCategory.isPending}
          disabled={upsertCategory.isPending}
        />
      </form>
    </Card>
  );
}
