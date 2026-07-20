import { useEffect, useRef } from "react";
import { formatDate } from "../../helpers/formatDate";
import { NotificationUIModel } from "../types/NotificationUIModel";

type Props = {
  notifications: NotificationUIModel[];
  onSelect: (id: string) => void;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  selectedId: string | null;
};

export default function NotificationList({
  notifications,
  onSelect,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  selectedId,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 20 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <aside className="h-full w-full space-y-2 border-r border-slate-700 p-4 lg:w-1/3">
      <h2 className="mb-4 text-lg font-bold">Caixa de Entrada</h2>

      <section
        ref={listRef}
        className="h-[80vh] overflow-y-auto border border-gray-500/15"
      >
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={`relative w-full rounded-md p-3 text-left ${n.readAt ? "opacity-60" : "opacity-100"} ${selectedId === n.id ? "border-l-4 border-cyan-400 bg-slate-700 opacity-100" : "hover:bg-slate-800"} `}
          >
            {!n.readAt && (
              <span className="absolute top-4 right-4 size-2 rounded-full bg-cyan-400" />
            )}

            <div className="text-sm text-gray-400">
              {formatDate(n.createdAt as any)}
            </div>

            <div className="text-base font-semibold text-[var(--text-primary)]">{n.title}</div>

            <div className="truncate text-sm text-gray-300">
              {n.description}
            </div>
          </button>
        ))}

        {isFetchingNextPage && (
          <div className="p-4 text-center text-gray-400">
            Carregando mais...
          </div>
        )}
      </section>
    </aside>
  );
}
