import { useQuery } from "@tanstack/react-query";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import { eventService } from "../services/eventService";

// 🔒 Defina isso corretamente no seu domínio
type EventResponse = Awaited<ReturnType<typeof eventService.find>>;

export default function useEvent(eventId?: string) {
  const { isAuthenticated } = useAuthStatus();

  const queryEvent = useQuery<EventResponse>({
    queryKey: ["eventData", eventId ?? "new"], // evita undefined no cache
    queryFn: () => {
      if (!eventId) {
        throw new Error("eventId is required for fetching event");
      }
      return eventService.find(eventId);
    },
    enabled: isAuthenticated && !!eventId,
  });

  return { queryEvent };
}
