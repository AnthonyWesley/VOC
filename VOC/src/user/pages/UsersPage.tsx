import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import useUsers from "../hooks/useUsers";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import Spin from "../../components/Spin";
import Modal from "../../components/Modal";
import UserForm from "../components/UserForm";
import { UserOutput } from "../types/userTypes";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import { PageHeader } from "../../components/PageHeader";
import { useModalStore } from "../../store/useModalStore";
import { LEVEL } from "../../shared/constants/levels";
import Avatar from "../../components/Avatar";

export default function UsersPage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();

  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<"all" | "true" | "false">("all");
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    queryUsers: {
      data,
      isLoading,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    },
  } = useUsers({
    search: debouncedSearch,
    isActive: isActive === "all" ? undefined : isActive === "true",
  });

  const users: UserOutput[] = data?.pages.flatMap((page) => page.data) ?? [];

  if (error) return <p className="text-red-400">Erro ao carregar usuários.</p>;

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* HEADER PREMIUM */}
      <PageHeader
        icon="mdi:account-group"
        title="Liderança"
        subtitle="Gerenciamento de lideranças do sistema"
        className="border-b border-slate-800/90 bg-none px-0 py-0 pb-4"
        onNew={() => openModal("createUserModal")}
        minLevel={LEVEL.PRESIDENT}
      />

      {/* SEARCH */}
      <div className="flex w-full items-center gap-4">
        <FormInput
          className="flex-1"
          // label="Filtro"
          icon="fluent:search-24-regular"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, email ou telefone"
        />
        {/* STATUS FILTER */}
        <FormInput
          // label="Status"
          icon="mdi:filter-outline"
          type="select"
          variant="md"
          value={isActive}
          onChange={(e) => setIsActive(e.target.value as any)}
          options={[
            { label: "Todos", value: "all" },
            { label: "Ativos", value: "true" },
            { label: "Inativos", value: "false" },
          ]}
        />
      </div>

      {/* LISTA PREMIUM */}
      {isLoading ? (
        <Spin no-modal />
      ) : (
        <ul role="list" className="space-y-4">
          {users.map((user) => {
            const active = user.isActive;

            return (
              <li
                key={user.userId}
                onClick={() => navigate(`/app/users/${user.userId}`)}
                className="group card-premium cursor-pointer p-4"
              >
                <div className="flex items-center justify-between gap-6">
                  {/* LEFT */}
                  <div className="flex items-center gap-4">
                    <Avatar
                      image={user.photoUrl ?? ""}
                      name={user.fullName ?? "Author"}
                      size="60"
                    />

                    <div>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {user.fullName ?? "Sem nome"}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">{user.email}</p>

                      {user.phone && (
                        <div className="mt-1 flex items-center gap-1">
                          <p className="text-xs text-gray-500">{user.phone}</p>
                          <a
                            href={`https://wa.me/${user.phone.replace(/\D/g, "")}`}
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
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                    <div className="mt-1 flex items-center gap-x-1.5">
                      <div
                        className={`flex-none rounded-full p-1 ${
                          active ? "bg-emerald-500/30" : "bg-red-500/30"
                        }`}
                      >
                        <div
                          className={`size-1.5 rounded-full ${
                            active ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        {active ? "Ativo" : "Inativo"}
                      </p>
                    </div>
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
            className="w-full md:w-auto"
          />
        </div>
      )}

      {/* MODAL GLOBAL */}
      <Modal id="createUserModal" className="flex" info="Registrar" scale={1.2}>
        <UserForm />
      </Modal>
    </div>
  );
}
