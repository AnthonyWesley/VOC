import { useNavigate, useParams } from "react-router-dom";
import { Balloon } from "../../components/Balloon";
import Icon from "../../components/Icon";
import { CardActions } from "../../components/CardActions";
import { LEVEL } from "../../shared/constants/levels";
import useCategory from "../hooks/useCategory";
import { PageHeader } from "../../components/PageHeader";

export default function CategoryDetailsPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const {
    queryCategory: { data: category, isLoading, error },
  } = useCategory(categoryId!);

  if (isLoading)
    return <p className="text-gray-300">Carregando categoria...</p>;

  if (error || !category)
    return <p className="text-red-400">Categoria não encontrada.</p>;

  const createdAt = new Date(category.createdAt).toLocaleString("pt-BR");
  const updatedAt = category.updatedAt
    ? new Date(category.updatedAt).toLocaleString("pt-BR")
    : "—";

  const isExpense = category.type === "EXPENSE";

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon={
          isExpense ? "mdi:arrow-up-bold-circle" : "mdi:arrow-down-bold-circle"
        }
        title={category.name}
        subtitle="Detalhes completos da categoria"
        back
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
      />

      <div className="mx-auto max-w-3xl space-y-8">
        {/* CARD PRINCIPAL */}
        <div className="card-premium p-6">
          {/* HEADER */}
          <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end">
            <div>
              <span
                className={`text-xs font-bold tracking-widest uppercase ${
                  isExpense ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {isExpense ? "Saída" : "Entrada"}
              </span>

              <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
                {category.name}
              </h1>
            </div>
          </div>

          {/* INFORMAÇÕES */}
          <Balloon className="mt-8" offset={40}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
              <Icon icon="mdi:information-outline" scale={0.9} />
              Informações da Categoria
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
              <Info label="Tipo" value={isExpense ? "Despesa" : "Receita"} />

              <Info
                label="ID"
                value={
                  <span className="font-mono text-[10px] text-gray-500 uppercase">
                    {category.id}
                  </span>
                }
              />
            </div>
          </Balloon>

          {/* AUDITORIA */}
          <Balloon className="mt-8" offset={40}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Auditoria</h2>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <Info label="Criado em" value={createdAt} />
              <Info label="Última atualização" value={updatedAt} />
            </div>
          </Balloon>

          {/* AÇÕES */}
          <div className="mt-8">
            <CardActions
              direction="horizontal"
              actions={[
                {
                  icon: "mdi:pencil",
                  info: "Editar categoria",
                  onClick: () =>
                    navigate(`/category/${category.id}/edit`),
                  scale: 0.8,
                  minLevel: LEVEL.TREASURER,
                },
                {
                  icon: "mdi:trash-can",
                  info: "Excluir categoria",
                  onClick: () => console.log("Delete", category.id),
                  scale: 0.8,
                  minLevel: LEVEL.TREASURER,
                },
              ]}
            />
          </div>
        </div>
      </div>
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
