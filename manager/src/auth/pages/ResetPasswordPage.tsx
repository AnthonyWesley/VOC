import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { validatePasswordRules } from "../components/authForm";
import useAuthMutations from "../hooks/useAuthMutations";
import InputLabel from "../../components/InputLabel";

import { useTimerStore } from "../../store/useTimerStore";
import { useTempAuth } from "../contexts/TempAuthContext";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Hooks de Mutação
  const { resetPassword, updateTemporaryPassword } = useAuthMutations();

  // Store do Timer
  const { expiresAt, message, listeners, clearTimer } = useTimerStore();

  // Estados do Formulário
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Recupera contexto de senha temporária (Caso A) — efêmero, não sobrevive a refresh
  const { tempAuth, setTempAuth } = useTempAuth();

  // Recupera código da URL (Caso B - Esqueci Senha)
  const resetCode = searchParams.get("code");

  // Redireciona se não há contexto válido (refresh durante fluxo, etc.)
  useEffect(() => {
    if (!tempAuth && !resetCode) {
      navigate("/auth/login", { replace: true });
    }
  }, []);

  const passwordValidation = validatePasswordRules(password);
  const isFormValid =
    Object.values(passwordValidation).every(Boolean) &&
    password === confirmPassword;

  // --- Lógica do Cronômetro (UI) ---
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiresAt.getTime() - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft("Expirado");
        listeners.forEach((cb) => cb()); // Executa callbacks de expiração
        clearTimer();
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, listeners, clearTimer]);

  // --- Submissão ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Verifique os requisitos da senha.");
      return;
    }

    if (tempAuth) {
      // CASO A: Senha Temporária
      updateTemporaryPassword.mutate(
        {
          email: tempAuth.email,
          currentPassword: tempAuth.currentPassword,
          newPassword: password,
        },
        {
          onSuccess: () => {
            toast.success("Senha atualizada com sucesso!");
            setTempAuth(null);
            clearTimer();
            navigate("/auth/login");
          },
        },
      );
    } else if (resetCode) {
      // CASO B: Esqueci Senha (via Código/Token)
      resetPassword.mutate(
        { code: resetCode, password },
        {
          onSuccess: () => {
            toast.success("Nova senha definida!");
            clearTimer();
            navigate("/auth/login");
          },
        },
      );
    } else {
      toast.error("Sessão inválida ou expirada.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-lg border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Definir Nova Senha</h1>
          {tempAuth && (
            <p className="mt-2 text-sm text-gray-400">
              Olá,{" "}
              <span className="font-medium text-cyan-400">
                {tempAuth.email}
              </span>
              . Por segurança, altere sua senha temporária.
            </p>
          )}
        </div>

        {/* --- Timer Display --- */}
        {expiresAt && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-center">
            <p className="text-xs font-semibold tracking-wider text-amber-500 uppercase">
              {message}
            </p>
            <p className="font-mono text-xl text-amber-400">{timeLeft}</p>
          </div>
        )}

        <div className="space-y-4">
          <InputLabel
            type="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua nova senha"
            required
            isPassword
          />

          <InputLabel
            type="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            required
            isPassword
          />
        </div>

        {/* --- Validação Visual --- */}
        <div className="grid grid-cols-1 gap-2 rounded-lg bg-black/20 p-4 text-xs">
          <PasswordRequirement
            label="8+ caracteres"
            met={passwordValidation.length}
          />
          <PasswordRequirement
            label="Letra minúscula"
            met={passwordValidation.lowercase}
          />
          <PasswordRequirement
            label="Letra maiúscula"
            met={passwordValidation.uppercase}
          />
          <PasswordRequirement
            label="Um número"
            met={passwordValidation.number}
          />
          <PasswordRequirement
            label="Caractere especial (@$!%*?&)"
            met={passwordValidation.specialChar}
          />
        </div>

        <button
          type="submit"
          disabled={
            !isFormValid ||
            updateTemporaryPassword.isPending ||
            resetPassword.isPending
          }
          className="w-full rounded bg-cyan-600 py-3 font-bold text-white shadow-lg shadow-cyan-900/20 transition-all hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateTemporaryPassword.isPending || resetPassword.isPending
            ? "Processando..."
            : "Redefinir Senha"}
        </button>
      </form>
    </div>
  );
}

// Sub-componente para os requisitos
function PasswordRequirement({ label, met }: { label: string; met: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 ${met ? "text-cyan-400" : "text-gray-500"}`}
    >
      <span className="text-lg">{met ? "✓" : "○"}</span>
      <span>{label}</span>
    </div>
  );
}
