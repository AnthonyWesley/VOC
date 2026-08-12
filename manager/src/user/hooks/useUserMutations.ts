import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModalStore } from "../../store/useModalStore";
import { userService } from "../services/userService";

export function useUserMutations() {
  const queryClient = useQueryClient();
  const { closeModal } = useModalStore();

  const createUser = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      toast.success("Usuário salvo com sucesso!");
      // closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usersData"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
    },
    onError: (error: any) => {
      if (error.response.status === 401) {
        toast.error("Esse e-mail já foi cadastrado.");
      } else
        toast.error(error.response?.data?.message || "Erro ao criar conta");
    },
  });

  const updateUser = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId?: string;
      data: { email: string };
    }) => userService.update(userId ?? "", data),
    onSuccess: () => {
      toast.success("Usuário salvo com sucesso!");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usersData"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Erro ao salvar user"),
  });

  const updateUserPhone = useMutation({
    mutationFn: ({ id, phone }: { id: string; phone: string }) =>
      userService.updatePhone(id, phone),
    onSuccess: () => {
      toast.success("Usuário salvo com sucesso!");
      closeModal();
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usersData"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Erro ao salvar user"),
  });

  const assignRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      userService.assignRole(userId, roleId), // Certifique-se de que isso chama o endpoint correto
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      toast.success("Cargo atribuído!");
    },
  });

  const removeRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      userService.removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      toast.success("Cargo removido!");
    },
  });

  const activeUser = useMutation({
    mutationFn: userService.active,
    onSuccess: () => {
      toast.success("Usuário ativo!");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usersData"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Erro ao ativar user"),
  });

  const adminResetPassword = useMutation({
    mutationFn: userService.adminResetPassword,
    onSuccess: () => {
      toast.success("Senha redefinida!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usersData"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Erro ao redefinir senha"),
  });

  const deactivateUser = useMutation({
    mutationFn: userService.deactivate,
    onSuccess: () => {
      toast.success("Usuário suspenso!");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usersData"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Erro ao suspender user"),
  });

  return {
    createUser,
    activeUser,
    deactivateUser,
    updateUser,
    updateUserPhone,
    assignRole,
    removeRole,
    adminResetPassword,
  };
}
