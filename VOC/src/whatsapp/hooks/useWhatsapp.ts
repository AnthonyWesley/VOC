import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { whatsappService } from "../services/whatsappService";

export function useWhatsapp() {
  const queryClient = useQueryClient();

  const instanceQuery = useQuery({
    queryKey: ["whatsappInstance"],
    queryFn: whatsappService.getInstance,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const createInstance = useMutation({
    mutationFn: (instanceName: string) => whatsappService.createInstance(instanceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappInstance"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao criar instância");
    },
  });

  const deleteInstance = useMutation({
    mutationFn: (instanceName: string) => whatsappService.deleteInstance(instanceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappInstance"] });
      toast.success("Instância desconectada");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao desconectar");
    },
  });

  const restartInstance = useMutation({
    mutationFn: (instanceName: string) => whatsappService.restartInstance(instanceName),
    onSuccess: () => {
      toast.success("Instância reiniciada");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao reiniciar");
    },
  });

  const refreshState = async (instanceName: string) => {
    try {
      const { state } = await whatsappService.getState(instanceName);
      return state;
    } catch {
      return "close";
    }
  };

  return {
    instance: instanceQuery.data?.instance ?? null,
    isLoading: instanceQuery.isLoading,
    createInstance,
    deleteInstance,
    restartInstance,
    refreshState,
  };
}
