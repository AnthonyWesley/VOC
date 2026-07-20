import { useQuery } from "@tanstack/react-query";

import useAuthStatus from "../auth/hooks/useAuthStatus";
import useDashboard from "../home/hooks/useDashboard";
import { eventService } from "../event/services/eventService";
import { postService } from "../post/services/postService";

import Icon from "./Icon";
import { Balloon } from "./Balloon";

import PostCarousel from "../dashboard/components/PostCarousel";
import { DashboardSection } from "../dashboard/components/DashboardSection";

import type {
  EventType,
  InactiveMember,
  DashboardData,
} from "../dashboard/types/dashboard.types";
import type { ListPostOutput } from "../post/types/postTypes";

const eventTypeLabel = (type: string): string => {
  const labels: Record<EventType | string, string> = {
    HOUSE_SERVICE: "House",
    SUNDAY_SERVICE: "Culto de Domingo",
    PRAYER_MEETING: "Oração",
    BIBLE_STUDY: "Estudo Bíblico",
    YOUTH_NIGHT: "Encontro de Jovens",
    SPECIAL_EVENT: "Evento Especial",
  };

  return labels[type] ?? type;
};

export default function RightDrawerContent() {
  const { authLevel } = useAuthStatus();
  const isPresident = authLevel >= 90;

  const { queryDashboard } = useDashboard();
  const dashboardQuery = queryDashboard as {
    data: DashboardData;
    isPending: boolean;
    error: unknown;
  };

  const { data: eventsList } = useQuery({
    queryKey: ["rightDrawerEvents"],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const result = await eventService.list({
        limit: 50,
        month: currentMonth,
        year: currentYear,
      });
      return result.data ?? [];
    },
    enabled: !isPresident,
  });

  const { data: postsList } = useQuery({
    queryKey: ["rightDrawerPosts"],
    queryFn: async () => {
      const result = await postService.list({ limit: 10 });
      return result.posts;
    },
    enabled: !isPresident,
  });

  const now = new Date();

  const getDashboardEvents = () => {
    if (!dashboardQuery.data?.events) return { last: null, upcoming: [] };
    return dashboardQuery.data.events;
  };

  const getEnd = (e: any) => {
    const d = e.endsAt ? new Date(e.endsAt) : null;
    return d ?? new Date(e.startsAt);
  };

  const getFallbackEvents = () => {
    if (!eventsList || eventsList.length === 0)
      return { last: null, upcoming: [] };
    const past = eventsList
      .filter((e: any) => getEnd(e) <= now)
      .sort(
        (a: any, b: any) =>
          getEnd(b).getTime() - getEnd(a).getTime(),
      );
    const upcoming = eventsList
      .filter((e: any) => getEnd(e) > now)
      .sort(
        (a: any, b: any) =>
          getEnd(a).getTime() - getEnd(b).getTime(),
      );
    return { last: past[0] ?? null, upcoming };
  };

  const events = isPresident ? getDashboardEvents() : getFallbackEvents();
  const posts: ListPostOutput[] = isPresident
    ? ((dashboardQuery.data?.posts as ListPostOutput[]) ?? [])
    : ((postsList as ListPostOutput[]) ?? []);

  const inactiveMembers = isPresident
    ? dashboardQuery.data?.inactiveMembers
    : undefined;

  const activeInactiveCategories = inactiveMembers
    ? (Object.entries(inactiveMembers).filter(
        ([, list]) => list && list.length > 0,
      ) as [EventType, InactiveMember[]][])
    : [];

  const showAusentes = isPresident && activeInactiveCategories.length > 0;

  if (!isPresident && !eventsList && !postsList) {
    return null;
  }

  return (
    <div className="space-y-6 px-4 py-4">
      {/* AUSENTES — apenas presidente */}
      {showAusentes && (
        <DashboardSection title="Ausentes (30+ dias)">
          <div className="flex flex-col gap-4">
            {activeInactiveCategories.map(([type, list]) => (
              <Balloon key={type} className="p-4" offset={20}>
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                  <Icon
                    icon="mdi:account-off"
                    className="text-[var(--accent-coral)]"
                  />

                  {eventTypeLabel(type)}
                </h3>

                <ul className="space-y-2 text-[var(--text-secondary)]">
                  {list.slice(0, 5).map((m) => (
                    <li
                      key={m.memberId}
                      className="flex items-center justify-between border-b border-[var(--card-border)] pb-1.5 last:border-none last:pb-0"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate text-sm">
                          {m.memberName}
                        </span>

                        {m.memberPhone && (
                          <a
                            href={`https://wa.me/${m.memberPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon
                              icon="mdi:whatsapp"
                              className="text-cyan-400 hover:text-emerald-300"
                              scale={0.4}
                            />
                          </a>
                        )}
                      </div>

                      <span className="shrink-0 rounded-full bg-[var(--bg-mid)]/50 px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                        {m.daysSinceLastEvent}d
                      </span>
                    </li>
                  ))}

                  {list.length > 5 && (
                    <li className="pt-1 text-xs font-medium text-[var(--text-muted)] italic">
                      ...e mais {list.length - 5}
                    </li>
                  )}
                </ul>
              </Balloon>
            ))}
          </div>
        </DashboardSection>
      )}

      {/* CULTOS */}
      <DashboardSection title="Cultos">
        <div className="space-y-4">
          {/* Último culto */}
          <Balloon className="p-4" offset={20}>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <Icon
                icon="mdi:history"
                className="text-[var(--accent-cyan)]"
              />
              Último culto
            </h3>

            {events?.last ? (
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p className="flex justify-between border-b border-[var(--card-border)] pb-1">
                  <span className="text-[var(--text-muted)]">Evento:</span>

                  <span className="truncate font-medium text-[var(--text-primary)]">
                    {(events.last as any).title ?? "Sem título"}
                  </span>
                </p>

                <p className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Data:</span>

                  <span className="font-medium">
                    {new Date(events.last.startsAt).toLocaleString(
                      "pt-BR",
                    )}
                  </span>
                </p>

                <p className="flex justify-between">
                  <span className="text-[var(--text-muted)]">
                    Presentes:
                  </span>

                  <span className="font-semibold text-[var(--text-primary)]">
                    {(events.last as any).attendance?.membersCount ?? 0}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Nenhum culto anterior encontrado.
              </p>
            )}
          </Balloon>

          {/* Próximos cultos */}
          <Balloon className="p-4" offset={20}>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <Icon
                icon="mdi:calendar-clock"
                className="text-[var(--accent-cyan)]"
              />
              Próximos cultos
            </h3>

            {events?.upcoming && events.upcoming.length > 0 ? (
              <ul className="space-y-2 text-[var(--text-secondary)]">
                {events.upcoming.map((s) => (
                  <li
                    key={s.id}
                    className="border-b border-[var(--card-border)] pb-2 last:border-none last:pb-0"
                  >
                    <strong className="text-sm text-[var(--text-primary)]">
                      {s.title}
                    </strong>

                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {new Date(s.startsAt).toLocaleString("pt-BR")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Nenhum culto agendado.
              </p>
            )}
          </Balloon>
        </div>
      </DashboardSection>

      {/* POSTS */}
      <DashboardSection title="Últimos posts">
        <PostCarousel posts={posts} />
      </DashboardSection>
    </div>
  );
}
