import { useState } from "react";
import useAuthMutations from "../hooks/useAuthMutations";

export function VerifyPhone() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { verifyPhoneCode, confirmUser } = useAuthMutations();

  const handleVerifyCode = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Verifica o código e pega o userId retornado
      await verifyPhoneCode.mutateAsync(
        {
          code,
          type: "PHONE_VERIFICATION",
          context: "",
        },
        {
          onSuccess: (data) => {
            if (!data?.userId) {
              throw new Error("USER_ID_NOT_RETURNED");
            }
            console.log(data);

            // 2️⃣ Confirma o usuário
            confirmUser.mutateAsync({
              userId: data.userId,
              code, // opcional, se precisar validar duplamente
            });

            // 3️⃣ Redireciona para login
            window.location.href = "/";
          },
        },
      );
    } catch (err) {
      setError("Código inválido ou expirado");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h1>Verificar telefone</h1>

      <input
        type="text"
        placeholder="Código recebido por SMS"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button onClick={handleVerifyCode} disabled={loading}>
        Verificar
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
