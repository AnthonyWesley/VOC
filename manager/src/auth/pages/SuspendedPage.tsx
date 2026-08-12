export default function SuspendedPage() {
  return (
    <div className="m-auto mt-20 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-5xl font-bold text-rose-600">Conta Suspensa</h1>
      <p className="mt-4 text-lg">
        Sua empresa está suspensa por falta de pagamento.
      </p>
      <p className="text-gray-300">
        Regularize suas faturas para voltar a acessar a plataforma.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <a
          href="/payments"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400 focus:outline-none"
        >
          Realizar Pagamento
        </a>
      </div>
    </div>
  );
}
