import useAuthStatus from "../../auth/hooks/useAuthStatus";
import Avatar from "../../components/Avatar";
import Icon from "../../components/Icon";
import { PageHeader } from "../../components/PageHeader";
import { ROLE_PERMISSIONS } from "../../shared/constants/rolePermissions";

export default function MyProfilePage() {
  const { authUser: user, isLoading } = useAuthStatus();

  if (isLoading) return <p className="p-6 text-center text-[var(--text-muted)]">Carregando...</p>;
  if (!user) return <p className="p-6 text-center text-[var(--accent-coral)]">Usuário não encontrado</p>;

  const formatDate = (d: Date | string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-4 md:px-6">
      <PageHeader
        icon="mdi:account-circle"
        title="Meu Perfil"
        subtitle="Suas informações pessoais e cargos"
        className="border-b border-[var(--card-border)] bg-none px-0 py-0 pb-4"
      />

      {/* Card principal */}
      <div className="card-premium space-y-6 p-6">
        {/* Avatar + Nome + Email */}
        <div className="flex flex-col items-center gap-3">
          <Avatar
            image={user.photoUrl ?? ""}
            size="100"
            className="rounded-full"
          />
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {user.fullName || "Sem nome"}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
          </div>
        </div>

        {/* Cargos */}
        <div className="flex flex-wrap justify-center gap-2">
          {user.roles.map((r) => (
            <span
              key={r.name}
              className="chip-cyan px-3 py-1 text-xs font-semibold"
            >
              {ROLE_PERMISSIONS[r.name]?.label ?? r.name}
            </span>
          ))}
        </div>

        {/* Grid de informações */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoBlock icon="mdi:phone" label="Telefone" value={user.phone || "Não informado"} />
          <InfoBlock icon="mdi:calendar" label="Nascimento" value={formatDate(user.birthDate)} />
          <InfoBlock icon="mdi:cross" label="Batismo" value={formatDate(user.baptismDate)} />
          <InfoBlock icon="mdi:calendar-check" label="Ingresso" value={formatDate(user.churchJoinDate)} />
          <InfoBlock
            icon="mdi:account-check"
            label="Status"
            value={
              <span className={user.status === "ACTIVE" ? "text-[var(--accent-cyan)]" : "text-[var(--accent-coral)]"}>
                {user.status === "ACTIVE" ? "Ativo" : user.status}
              </span>
            }
          />
        </div>

        {/* Ministériios */}
        {user.ministries.length > 0 && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Icon icon="mdi:church" className="text-base text-[var(--accent-cyan)]" />
              Ministérios
            </h3>
            <div className="space-y-1.5">
              {user.ministries.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--bg-mid)]/40 px-3 py-2 text-sm"
                >
                  <span className="text-[var(--text-primary)]">{m.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    desde {formatDate(m.joinedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-mid)]/40 px-4 py-3">
      <Icon icon={icon} className="text-lg text-[var(--text-muted)]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}
