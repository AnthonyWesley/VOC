type EventHeaderProps = {
  title: string;
  createdAt: string | Date;
  navigate: (value: number) => void;
};

export default function EventHeader({
  title,
  createdAt,
  navigate,
}: EventHeaderProps) {
  const created = new Date(createdAt).toLocaleDateString("pt-BR");

  return (
    <div className="px-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>

      <p
        className="cursor-pointer text-gray-400 hover:text-[var(--text-primary)]"
        onClick={() => navigate(-1)}
      >
        ← Voltar para eventos
      </p>

      <p className="mt-1 text-xs text-gray-500">Criado em {created}</p>
    </div>
  );
}
