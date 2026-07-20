import { useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { PageHeader } from "../../components/PageHeader";
import Modal from "../../components/Modal";
import useMinistries from "../hooks/useMinistries";
import { useNavigate } from "react-router-dom";
import { useMinistryMutations } from "../hooks/useMemberMutations";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import { useModalStore } from "../../store/useModalStore";
import { LEVEL } from "../../shared/constants/levels";

export default function MinistriesPage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const { createMember } = useMinistryMutations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const {
    queryMinistries: { data: ministries, isLoading, error },
  } = useMinistries();

  const totalMembers = useMemo(
    () => (ministries ?? []).reduce((sum, m: any) => sum + (m.memberCount ?? 0), 0),
    [ministries],
  );

  if (isLoading)
    return <p className="text-[var(--text-secondary)]">Carregando ministérios...</p>;
  if (error)
    return <p className="text-[var(--accent-coral)]">Erro ao carregar ministérios.</p>;

  const handleCreate = () => {
    if (!name.trim()) return;
    createMember.mutate(
      { name: name.trim(), description: description.trim() },
      { onSuccess: () => { setName(""); setDescription(""); } },
    );
  };

  return (
    <div className="space-y-6 px-4 md:px-6">
      <PageHeader
        icon="mdi:church"
        title="Ministérios"
        subtitle="Organização e áreas de atuação da igreja"
        className="border-b border-[var(--card-border)] bg-none px-0 py-0 pb-4"
        onNew={() => openModal("createMinistryModal")}
        minLevel={LEVEL.PRESIDENT}
      />

      {/* RELATÓRIO */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card-premium p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Ministérios
          </p>
          <p className="mt-3 text-2xl font-black text-[var(--accent-cyan)]">
            {ministries?.length ?? 0}
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Membros alocados
          </p>
          <p className="mt-3 text-2xl font-black text-[var(--accent-cyan)]">
            {totalMembers}
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Média por ministério
          </p>
          <p className="mt-3 text-2xl font-black text-[var(--accent-cyan)]">
            {ministries?.length
              ? (totalMembers / ministries.length).toFixed(1)
              : "0"}
          </p>
        </div>
      </section>

      <Modal
        id="createMinistryModal"
        className="hidden"
      >
        <div className="space-y-4 p-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Novo ministério</h2>
          <FormInput
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do ministério"
          />
          <FormInput
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional"
          />
          <FormButton
            label="Criar"
            onClick={handleCreate}
            isPending={createMember.isPending}
            disabled={!name.trim()}
          />
        </div>
      </Modal>

      <ul role="list" className="space-y-4">
        {ministries?.map((m: any) => (
          <li
            key={m.id}
            onClick={() => navigate(`/app/ministries/${m.id}`)}
            className="card-premium group cursor-pointer p-4 transition-all hover:border-[var(--card-border-hover)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-[var(--surface-alt)] text-[var(--accent-cyan)]">
                <Icon icon="mdi:church" scale={1.1} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{m.name}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {m.description ?? "Sem descrição"}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>{m.memberCount ?? 0} membro{(m.memberCount ?? 0) !== 1 ? "s" : ""}</span>
                  <span>Criado em: {new Date(m.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
