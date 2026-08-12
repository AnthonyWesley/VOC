import { useState } from "react";
import useAuthMutations from "../hooks/useAuthMutations";

import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";

export function validatePasswordRules(password: string) {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[@$!%*?&]/.test(password),
  };
}

export default function AuthForm() {
  const { login } = useAuthMutations();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <FormInput
        label="Email"
        icon="mdi:email-outline"
        type="text"
        placeholder="Digite seu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <FormInput
        label="Senha"
        icon="mdi:lock-outline"
        type="password"
        placeholder="Digite sua senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <FormButton
        type="submit"
        label={login.isPending ? "Entrando..." : "Entrar"}
        icon="mdi:login"
        isPending={login.isPending}
        disabled={login.isPending}
      />
    </form>
  );
}
