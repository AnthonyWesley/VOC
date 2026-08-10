import { useQuery } from "@tanstack/react-query";
import { instagramService } from "../services/instagramService";

export function useInstagramMedia() {
  return useQuery({
    queryKey: ["instagramMedia"],
    queryFn: instagramService.getMedia,
    staleTime: 15 * 60 * 1000,
  });
}