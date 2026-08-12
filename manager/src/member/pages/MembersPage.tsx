import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import Modal from "../../components/Modal";
import MemberForm from "../components/MemberForm";
import { calculateAge } from "../../helpers/calculateAge";
import useMembers from "../hooks/useMembers";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import Spin from "../../components/Spin";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import Avatar from "../../components/Avatar";
import { PageHeader } from "../../components/PageHeader";
import { useModalStore } from "../../store/useModalStore";
import { LEVEL } from "../../shared/constants/levels";
import { downloadExcelReport } from "../../helpers/reportExport";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const navigate = useNavigate();
  const { openModal } = useModalStore();

  const {
    queryMembers: {
      data,
      isLoading,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    },
  } = useMembers({ mode: "all", search: debouncedSearch });

  const members = data?.pages.flatMap((page) => page.data) ?? [];

  if (error) {
    return <p className="text-red-400">Erro ao carregar membros.</p>;
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon="mdi:account-group"
        title="Membros"
        subtitle="Gerenciamento de membros da igreja"
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
        onNew={() => openModal("createMemberModal")}
        minLevel={LEVEL.PRESIDENT}
      />

      {/* SEARCH + EXPORT */}
      <div className="flex w-full items-center gap-4">
        <FormInput
          icon="mdi:magnify"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <button
          onClick={() => {
            const rows = members.map((m: any) => ({
              Nome: m.fullName ?? "",
              Idade: calculateAge(m.birthDate) ?? "",
              Telefone: m.phone ?? "",
              Status: m.status === "ACTIVE" ? "Ativo" : "Inativo",
              "Data de Cadastro": m.createdAt
                ? new Date(m.createdAt).toLocaleDateString("pt-BR")
                : "",
            }));
            downloadExcelReport(
              `membros-${new Date().toISOString().slice(0, 10)}`,
              [
                { label: "Nome", key: "Nome" },
                { label: "Idade", key: "Idade" },
                { label: "Telefone", key: "Telefone" },
                { label: "Status", key: "Status" },
                { label: "Data de Cadastro", key: "Data de Cadastro" },
              ],
              rows,
            );
          }}
          className="rounded-lg bg-[var(--accent-cyan)]/20 px-3 py-1.5 text-xs font-bold text-[var(--accent-cyan)] transition-colors hover:bg-[var(--accent-cyan)]/30"
        >
          Exportar Excel
        </button>
      </div>

      {/* LISTA PREMIUM */}
      {isLoading ? (
        <Spin no-modal />
      ) : (
        <ul role="list" className="space-y-4">
          {members.map((member: any) => {
            const age = calculateAge(member.birthDate);
            const isActive = member.status === "ACTIVE";

            return (
              <li
                key={member.id}
                onClick={() => navigate(`/member/${member.id}`)}
                className="group card-premium cursor-pointer p-4"
              >
                <div className="flex items-center justify-between gap-6">
                  {/* LEFT */}
                  <div className="flex items-center gap-4">
                    <Avatar
                      image={member.photoUrl ?? undefined}
                      name={member.fullName}
                      size="60"
                      className="rounded-full bg-slate-800 outline-1 outline-white/10"
                    />

                    <div>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {member.fullName}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Idade: {age ?? "—"}
                      </p>

                      <div className="mt-1 flex items-center gap-1">
                        <p className="text-xs text-gray-500">
                          {member.phone ?? "-"}
                        </p>
                        {member.phone && (
                          <a
                            href={`https://wa.me/${member.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon
                              icon="mdi:whatsapp"
                              className="text-emerald-400 hover:text-emerald-300"
                              width={14}
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                    <div className="mt-1 flex items-center gap-x-1.5">
                      <div
                        className={`flex-none rounded-full p-1 ${
                          isActive ? "bg-emerald-500/30" : "bg-red-500/30"
                        }`}
                      >
                        <div
                          className={`size-1.5 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        {isActive ? "Ativo" : "Inativo"}
                      </p>
                    </div>

                    {member.hasHouseParticipation && (
                      <span className="mt-1 rounded-full bg-cyan-600/30 px-2 py-0.5 text-xs text-cyan-300">
                        House
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* LOAD MORE */}
      {hasNextPage && (
        <div className="my-4 flex justify-center">
          <FormButton
            label={isFetchingNextPage ? "Carregando..." : "Carregar mais"}
            icon="mdi:arrow-down"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full md:w-xl"
          />
        </div>
      )}

      {/* MODAL GLOBAL */}
      <Modal
        id="createMemberModal"
        className="flex"
        info="Registrar"
        scale={1.2}
      >
        <MemberForm />
      </Modal>
    </div>
  );
}
