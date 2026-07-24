import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService, ValidateCodePayload } from "../services/auth";
import { toast } from "react-toastify";
import { useModalStore } from "../../store/useModalStore";
import { useTimerStore } from "../../store/useTimerStore";
import { useTempAuth } from "../contexts/TempAuthContext";

export default function useAuthMutations() {
  const queryClient = useQueryClient();
  const { closeModal } = useModalStore();
  const navigate = useNavigate();
  const { clearTimer } = useTimerStore();
  const { setTempAuth } = useTempAuth();

  const login = useMutation({
    mutationFn: authService.login,
    onSuccess: () => {
      setTempAuth(null);
      sessionStorage.removeItem("redirected");
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      navigate("/app");
    },
    onError: (error: any, variables) => {
      const status = error.response?.status;
      const errorCode = error.response?.data?.code;

      if (status === 403 && errorCode === "TEMPORARY_PASSWORD_REQUIRED") {
        setTempAuth({
          email: variables.email,
          currentPassword: variables.password,
        });

        toast.info("Alteração de senha obrigatória.");
        navigate("/auth/reset-password");
        return;
      }

      if (status === 403 && errorCode === "TEMPORARY_PASSWORD_EXPIRED") {
        setTempAuth(null);
        toast.error("Sua senha temporária expirou. Solicite uma nova ao presidente.");
        return;
      }

      toast.error(
        error.response?.data?.message || "Erro ao fazer login. Verifique suas credenciais.",
      );
    },
  });
  const startUserRegistration = useMutation({
    mutationFn: authService.startUserRegistration,
    onSuccess: () => {
      toast.success("Código enviado para o seu telefone!");
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        toast.error("Telefone ou email inválido.");
      } else {
        toast.error(
          error.response?.data?.message || "Erro ao iniciar registro",
        );
      }
    },
  });

  const completeUserRegistration = useMutation({
    mutationFn: authService.completeUserRegistration,
    onSuccess: () => {
      toast.success("Conta criada com sucesso!");
      navigate("/app/posts"); // redireciona para home ou dashboard
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        toast.error("Código inválido ou dados incorretos.");
      } else {
        toast.error(error.response?.data?.message || "Erro ao criar conta");
      }
    },
  });

  const verifyPhoneCode = useMutation({
    mutationFn: (data: ValidateCodePayload) => authService.validateCode(data),
    onSuccess: () => {
      // navigate("/dashboard");
      // closeModal("PartnerLogout");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao criar conta");
    },
  });

  const requestPhoneCode = useMutation({
    mutationFn: (phone: string) => authService.requestPhoneCode({ phone }),
    onSuccess: () => {
      // navigate("/dashboard");
      // closeModal("PartnerLogout");
    },
    onError: (error: any) => {
      console.log(error);

      toast.error(error.response?.data?.error || "Erro ao criar conta");
    },
  });

  const updateTemporaryPassword = useMutation({
    mutationFn: (data: {
      email: string;
      currentPassword?: string;
      newPassword: string;
    }) => authService.updateTemporaryPassword(data),

    onSuccess: () => {
      setTempAuth(null);
      clearTimer();
      toast.success("Senha atualizada com sucesso! Por favor, faça login.");
      navigate("/auth/login");
    },

    onError: (error: any) => {
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const message =
        error.response?.data?.message || "Erro ao atualizar senha temporária.";
      toast.error(message);

      if (status === 403 && code === "TEMPORARY_PASSWORD_EXPIRED") {
        setTempAuth(null);
        clearTimer();
        navigate("/auth/login");
      }
    },
  });

  const resetPassword = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      navigate("/auth/login");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao redefinir senha");
    },
  });

  const confirmUser = useMutation({
    mutationFn: ({ userId, code }: { userId: string; code: string }) =>
      authService.confirm(userId, code),
    onSuccess: () => {
      toast.success("Parceiro ativo!");
      closeModal();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Erro ao ativar user"),
  });

  const logout = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setTempAuth(null);
      queryClient.clear();
      window.location.href = "/auth/login";
    },
    onError: () => {
      setTempAuth(null);
      queryClient.clear();
      window.location.href = "/auth/login";
    },
  });

  return {
    login,
    startUserRegistration,
    completeUserRegistration,
    verifyPhoneCode,
    requestPhoneCode,
    confirmUser,
    resetPassword,
    updateTemporaryPassword,
    logout,
  };
}
