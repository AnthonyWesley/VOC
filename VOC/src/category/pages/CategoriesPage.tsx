import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import CategoryForm from "../components/CategoryForm";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import useCategories from "../hooks/useCategories";
import Spin from "../../components/Spin";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import { PageHeader } from "../../components/PageHeader";
import { useModalStore } from "../../store/useModalStore";
import { LEVEL } from "../../shared/constants/levels";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "">("");

  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    queryCategories: {
      data,
      isLoading,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    },
  } = useCategories({
    search: debouncedSearch,
    type: type || undefined,
  });

  const categories = data?.pages.flatMap((page) => page.data) ?? [];

  if (error) {
    return <p className="text-red-400">Erro ao carregar categorias.</p>;
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon="mdi:shape"
        title="Categorias"
        subtitle="Organização de entradas e saídas"
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
        onNew={() => openModal("createCategoryModal")}
        minLevel={LEVEL.TREASURER}
      />

      {/* FILTROS */}
      <div className="flex w-full items-center gap-3">
        <FormInput
          icon="mdi:magnify"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />

        <FormInput
          type="select"
          icon="mdi:filter-outline"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          options={[
            { label: "Todos", value: "" },
            { label: "Entrada", value: "INCOME" },
            { label: "Saída", value: "EXPENSE" },
          ]}
          variant="md"
        />
      </div>

      {/* LISTA PREMIUM */}
      {isLoading ? (
        <Spin no-modal />
      ) : (
        <ul role="list" className="space-y-4">
          {categories?.map((cat) => {
            const isExpense = cat.type === "EXPENSE";

            return (
              <li
                key={cat.id}
                onClick={() => navigate(`/app/categories/${cat.id}`)}
                className="group card-premium cursor-pointer rounded-2xl p-4"
              >
                <div className="flex items-center gap-4">
                  {/* ÍCONE PREMIUM */}
                  <div
                    className={`flex size-14 items-center justify-center rounded-xl bg-slate-800 ${
                      isExpense ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    <Icon
                      icon={
                        isExpense
                          ? "mdi:arrow-up-bold-circle"
                          : "mdi:arrow-down-bold-circle"
                      }
                      scale={1.2}
                    />
                  </div>

                  {/* INFO */}
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {cat.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {isExpense ? "Saída" : "Entrada"}
                    </p>
                  </div>

                  {/* ID */}
                  <div className="font-mono text-xs text-gray-500 uppercase">
                    {cat.id}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* BOTÃO CARREGAR MAIS */}
      {hasNextPage && (
        <div className="my-4 flex justify-center">
          <FormButton
            label={isFetchingNextPage ? "Carregando..." : "Carregar mais"}
            icon="mdi:arrow-down"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full md:w-xl"
          />
        </div>
      )}

      {/* MODAL GLOBAL */}
      <Modal
        id="createCategoryModal"
        className="flex"
        info="Registrar"
        scale={1.2}
      >
        <CategoryForm />
      </Modal>
    </div>
  );
}
