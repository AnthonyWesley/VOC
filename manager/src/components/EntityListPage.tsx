import { useState, useRef, useEffect } from "react";
import Modal from "./Modal";
import InputSearch from "./InputSearch";
import NavAction from "./NavAction";
import AnimatedSection from "./AnimatedSection";

type EntityListPageProps<T> = {
  title: string;
  searchPlaceholder: string;
  useQuery: (search: string) => {
    data?: T[];
    isLoading: boolean;
    error?: Error;
  };
  CardComponent: (item: T) => React.ReactNode;
  FormModal?: React.ReactNode;
  onItemClick: (item: T) => void;
};

export default function EntityListPage<T>({
  title,
  searchPlaceholder,
  useQuery,
  CardComponent,
  FormModal,
  onItemClick,
}: EntityListPageProps<T>) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: entities, isLoading } = useQuery(debouncedSearch);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  const hasMore = visibleCount < (entities?.length || 0);

  return (
    <>
      <section className="flex flex-col gap-2 font-bold sm:flex-row sm:items-center sm:justify-between">
        <header className="mt-2 flex w-full items-center justify-between">
          <InputSearch
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            onOpenChange={setIsSearchOpen}
          />
          <div
            className={`flex items-center gap-4 transition-all duration-900 ${
              isSearchOpen
                ? "pointer-events-none hidden -translate-x-10"
                : "translate-x-0 opacity-100"
            }`}
          >
            <h1 className="mr-10 text-xl font-semibold">{title}</h1>
          </div>
          {FormModal && (
            <Modal
              id={`${title}Form`}
              className="hidden lg:flex"
              icon="ic:baseline-plus"
            >
              {FormModal}
            </Modal>
          )}
          {FormModal && (
            <NavAction className="justify-center lg:hidden">
              <Modal id={`${title}Form`} className="" icon="ic:baseline-plus">
                {FormModal}
              </Modal>
            </NavAction>
          )}
        </header>
      </section>

      <section className="mb-20 grid w-full place-items-center gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : entities && entities.length > 0 ? (
          entities.slice(0, visibleCount).map((entity, index) => (
            <AnimatedSection
              key={index}
              className="w-full cursor-pointer"
              onClick={() => onItemClick(entity)}
            >
              {CardComponent(entity)}
            </AnimatedSection>
          ))
        ) : (
          <p className="col-span-full text-center">
            Nenhum item encontrado para a busca.
          </p>
        )}

        {hasMore && (
          <div className="col-span-full mt-4 flex justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="rounded-lg bg-cyan-800 px-4 py-2 hover:bg-cyan-700"
            >
              Ver mais
            </button>
          </div>
        )}
      </section>
    </>
  );
}
