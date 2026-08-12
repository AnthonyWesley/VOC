import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { siteContentService } from "../services/siteContentService";
import { SiteContentUpdateInput } from "../types/siteContentTypes";

export function useAdminSiteContent() {
  return useQuery({
    queryKey: ["siteContentAdmin"],
    queryFn: siteContentService.getAdmin,
  });
}

export function useSiteContentMutations() {
  const queryClient = useQueryClient();

  const updateSiteContent = useMutation({
    mutationFn: (payload: SiteContentUpdateInput) =>
      siteContentService.update(payload),
    onSuccess: () => {
      toast.success("Conteudo da landing atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["siteContentPublic"] });
      queryClient.invalidateQueries({ queryKey: ["siteContentAdmin"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Não foi possível atualizar o conteúdo da landing.");
    },
  });

  return { updateSiteContent };
}
