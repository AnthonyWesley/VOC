import { Icon } from "@iconify/react";
import Avatar from "../../components/Avatar";
import { CardActions } from "../../components/CardActions";
import { calculateAge } from "../../helpers/calculateAge";
import { Balloon } from "../../components/Balloon";
import useMember from "../hooks/useMember";
import MemberForm from "../components/MemberForm";
import { PageHeader } from "../../components/PageHeader";
import { useParams } from "react-router-dom";
import { LEVEL } from "../../shared/constants/levels";

export default function MemberDetailPage() {
  const { memberId } = useParams();

  const {
    queryMember: { data: member, isLoading, error },
  } = useMember(memberId!);

  if (isLoading) return <p className="text-gray-300">Carregando membro...</p>;
  if (error || !member)
    return <p className="text-red-400">Membro não encontrado.</p>;

  const age = calculateAge(member.birthDate);

  const birth = member.birthDate
    ? new Date(member.birthDate).toLocaleDateString("pt-BR")
    : "—";

  const baptism = member.baptismDate
    ? new Date(member.baptismDate).toLocaleDateString("pt-BR")
    : "—";

  const joinDate = new Date(member.churchJoinDate).toLocaleDateString("pt-BR");
  const created = new Date(member.createdAt).toLocaleDateString("pt-BR");

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon="mdi:account-group"
        title={member.fullName}
        subtitle="Informações completas do membro"
        back
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
      />

      {/* CONTEÚDO CENTRALIZADO */}
      <div className="mx-auto max-w-3xl space-y-8">
        {/* CARD PRINCIPAL */}
        <div className="card-premium relative flex items-center gap-6 rounded-2xl border border-slate-800 p-6 shadow-sm backdrop-blur-md">
          {/* AVATAR */}
          <Avatar
            image={member.photoUrl ?? undefined}
            name={member.fullName}
            size="96"
            className="rounded-full bg-gray-800 outline-1 outline-white/10"
          />

          {/* INFO */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {member.fullName}
            </h1>

            <div className="mt-3 flex items-center gap-2">
              {member.status === "ACTIVE" ? (
                <>
                  <div className="rounded-full bg-emerald-500/30 p-1">
                    <div className="size-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-sm text-emerald-400">Ativo</span>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-red-500/30 p-1">
                    <div className="size-2 rounded-full bg-red-500"></div>
                  </div>
                  <span className="text-sm text-red-400">Inativo</span>
                </>
              )}

              {member.hasHouseParticipation && (
                <span className="ml-2 rounded-full bg-cyan-600/30 px-3 py-1 text-xs text-cyan-300">
                  Já participou de House
                </span>
              )}
            </div>
          </div>

          {/* AÇÕES */}

          <CardActions
            direction="vertical"
            fixed
            actions={[
              {
                icon: "mdi:account-edit",
                info: "Editar membro",
                modalId: `editMemberModal-${member.id}`,
                scale: 1,
                content: <MemberForm member={member} />,
                minLevel: LEVEL.PRESIDENT,
              },
              {
                icon:
                  member.status === "ACTIVE"
                    ? "mdi:account-cancel"
                    : "mdi:account-check",
                info:
                  member.status === "ACTIVE"
                    ? "Desativar membro"
                    : "Ativar membro",
                onClick: () =>
                  member.status === "ACTIVE"
                    ? console.log(member.id)
                    : console.log(member.id),
                scale: 1,
              },
            ]}
          />
        </div>

        {/* MINISTÉRIOS */}
        <Balloon className="mt-4" offset={40}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Ministérios
          </h2>

          {member.ministries.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              Nenhum ministério associado.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {member.ministries.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full bg-indigo-600/30 px-3 py-1 text-xs text-indigo-300"
                >
                  {m.name}
                </span>
              ))}
            </div>
          )}
        </Balloon>

        {/* INFORMAÇÕES PESSOAIS */}
        <Balloon className="mt-4" offset={40}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Informações pessoais
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Telefone</p>
              <div className="flex items-center gap-1">
                <p className="text-[var(--text-primary)]">
                  {member.phone ?? "—"}
                </p>
                {member.phone && (
                  <a
                    href={`https://wa.me/${member.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon
                      icon="mdi:whatsapp"
                      className="text-emerald-400 hover:text-emerald-300"
                      width={16}
                    />
                  </a>
                )}
              </div>
            </div>
            <Info label="Idade" value={age ?? "—"} />
            <Info label="Nascimento" value={birth} />
            <Info label="Batismo" value={baptism} />
            <Info label="Entrada na igreja" value={joinDate} />
            <Info label="CEP" value={member.postcode ?? "—"} />

            <div className="col-span-2">
              <Info label="Endereço" value={member.address ?? "—"} />
            </div>

            <Info label="Criado em" value={created} />
          </div>
        </Balloon>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
