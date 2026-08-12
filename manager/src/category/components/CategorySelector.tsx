import { useState, useEffect } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import useCategories from "../hooks/useCategories";
import { TransactionDirectionType } from "../services/categoriesService";
import { FormInput } from "../../components/FormInput";

type Category = {
  id: string;
  name: string;
  type: TransactionDirectionType;
};

export default function CategorySelector({
  value,
  onChange,
  type,
}: {
  value: Category | null;
  onChange: (category: Category) => void;
  type: "INCOME" | "EXPENSE";
}) {
  const [search, setSearch] = useState(value?.name ?? "");
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { queryCategories } = useCategories({
    search: debouncedSearch,
    type,
  });

  const categories = queryCategories.data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    setSearch(value?.name ?? "");
  }, [value]);

  return (
    <div className="relative w-full">
      <FormInput
        icon="mdi:tag-multiple-outline"
        label="CATEGORIA"
        placeholder="Buscar categoria"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      />

      {showDropdown && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-700 bg-gray-900 shadow-lg">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <li
                key={cat.id}
                onClick={() => {
                  onChange(cat);
                  setSearch(cat.name);
                  setShowDropdown(false);
                }}
                className="cursor-pointer px-3 py-2 hover:bg-gray-700"
              >
                <p className="text-sm text-[var(--text-primary)]">{cat.name}</p>
                <p className="text-xs text-gray-400">
                  {cat.type === "EXPENSE" ? "Saída" : "Entrada"}
                </p>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-400">
              Nenhum resultado
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
