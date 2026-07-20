import { useNavigate } from "react-router-dom";

type ErrorPageProps = {
  code: number;
  title?: string;
  message?: string;
  showBackButton?: boolean;
};
export default function ErrorPage({
  code,
  title,
  message,
  showBackButton = true,
}: ErrorPageProps) {
  const navigate = useNavigate();

  const defaultMessages: Record<number, { title: string; message: string }> = {
    401: {
      title: "Não autorizado",
      message: "Você precisa estar logado para acessar esta página.",
    },
    403: {
      title: "Acesso negado",
      message: "Você não tem permissão para acessar esta página.",
    },
    404: {
      title: "Página não encontrada",
      message: "A página que você procura não existe.",
    },
  };

  const error = defaultMessages[code] || {
    title: title || "Erro",
    message: message || "Algo deu errado.",
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-bold text-red-600">{code}</h1>
      <h2 className="mt-4 text-xl font-semibold">{error.title}</h2>
      <p className="mt-2 text-lg text-gray-600">{error.message}</p>
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Voltar
        </button>
      )}
    </div>
  );
}
