import { useEffect } from "react";
import AuthForm from "../components/authForm";

export default function AuthPage() {
  useEffect(() => {
    sessionStorage.removeItem("redirected");
  }, []);

  return (
    <section className="flex min-h-screen items-stretch text-white">
      {/* Lado esquerdo — imagem */}
      <div
        className="relative hidden w-1/2 items-center bg-gray-500 bg-cover bg-no-repeat lg:flex"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1577495508048-b635879837f1?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=675&q=80)",
        }}
      >
        <div className="absolute inset-0 z-0 bg-black opacity-60"></div>
        <div className="z-10 w-full px-24">
          <h1 className="text-left text-5xl font-bold tracking-wide">
            VOC Church
          </h1>
          <p className="my-4 text-3xl">
            Uma comunidade de fé, amor e transformação.
          </p>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex w-full items-center justify-center bg-gradient-to-b from-[var(--bg-top)] via-[var(--bg-mid)] to-[var(--bg-bot)] px-4 lg:w-1/2">
        <div className="w-full max-w-sm py-6">
          <h1 className="my-6 flex justify-center">
            <span className="text-3xl font-bold text-indigo-400">VOC</span>
            <span className="text-3xl font-bold text-cyan-400"> Church</span>
          </h1>

          <p className="mb-6 text-center text-sm text-gray-400">
            Entre com sua conta
          </p>

          <AuthForm />
        </div>
      </div>
    </section>
  );
}
