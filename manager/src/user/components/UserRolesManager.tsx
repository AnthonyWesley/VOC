import { useState, useMemo } from "react";
import useAuthStatus from "../../auth/hooks/useAuthStatus";
import Icon from "../../components/Icon";
import { Balloon } from "../../components/Balloon";
import { useUserMutations } from "../hooks/useUserMutations";
import useRoles from "../hooks/useRoles";
import { LEVEL } from "../../shared/constants/levels";
import { ROLE_PERMISSIONS } from "../../shared/constants/rolePermissions";

type Props = {
  userId: string;
  roles: { name: string; id: string }[];
};

export function UserRolesManager({ userId, roles }: Props) {
  const { authLevel } = useAuthStatus();
  const {
    queryRoles: { data: allRoles, isLoading, error },
  } = useRoles();

  const { assignRole, removeRole } = useUserMutations();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const availableRoles = useMemo(() => {
    if (!allRoles) return [];
    return allRoles.filter(
      (role) =>
        !roles.some((userRole: { id: string }) => userRole.id === role.id),
    );
  }, [allRoles, roles]);

  const selectedRoleData = useMemo(() => {
    if (!selectedRole || !allRoles) return null;
    return allRoles.find((r) => r.id === selectedRole) ?? null;
  }, [selectedRole, allRoles]);

  const selectedPermissions = selectedRoleData
    ? ROLE_PERMISSIONS[selectedRoleData.name]
    : null;

  if (isLoading)
    return <p className="text-gray-300">Carregando permissões...</p>;

  if (error || !allRoles)
    return <p className="text-red-400">Erro ao carregar permissões.</p>;

  return (
    <Balloon className="mt-8" offset={40}>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Permissões</h2>

      {/* Roles atuais */}
      {roles.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">
          Nenhuma permissão atribuída.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {roles.map((role) => {
            const perm = ROLE_PERMISSIONS[role.name];
            return (
              <div
                key={role.name}
                className="group relative flex items-center gap-2 rounded-full bg-gray-800/60 px-3 py-1 text-xs text-gray-300"
              >
                {perm?.label ?? role.name}

                <button
                  onClick={() => {
                    removeRole.mutate(
                      { userId, roleId: role.id },
                      {
                        onSuccess: () => {
                          setSelectedRole("");
                        },
                      },
                    );
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Icon icon="mdi:close" scale={0.7} />
                </button>

                {perm && (
                  <div className="invisible absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-xs text-gray-300 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                    <p className="font-medium text-white">{perm.label}</p>
                    <p className="mt-1 text-gray-400">{perm.description}</p>
                    <p className="mt-1 text-indigo-400">nível {perm.level}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Adicionar role */}
      {authLevel >= LEVEL.PRESIDENT && (
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="select select-sm w-48 bg-gray-900 text-gray-200"
            >
              <option value="">Adicionar permissão...</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {ROLE_PERMISSIONS[role.name]?.label ?? role.name}
                </option>
              ))}
            </select>

            <button
              disabled={!selectedRole || assignRole.isPending}
              onClick={() => {
                assignRole.mutate(
                  { userId, roleId: selectedRole },
                  {
                    onSuccess: () => {
                      setSelectedRole("");
                    },
                  },
                );
              }}
              className="btn btn-sm bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              Adicionar
            </button>
          </div>

          {/* Painel de informação da role selecionada */}
          {selectedPermissions && (
            <div className="mt-4 rounded-lg border border-gray-700/50 bg-gray-800/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {selectedPermissions.label}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedPermissions.description}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-600/20 px-2 py-0.5 text-xs text-indigo-400">
                  nível {selectedPermissions.level}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1">
                {selectedPermissions.accesses.map((acc) => (
                  <div
                    key={acc.label}
                    className="flex items-center gap-2 rounded px-2 py-1 text-xs"
                  >
                    <Icon
                      icon={acc.icon}
                      scale={0.8}
                      className={
                        acc.access === "bloqueado"
                          ? "text-gray-600"
                          : acc.access === "ver"
                            ? "text-yellow-400"
                            : "text-emerald-400"
                      }
                    />
                    <span
                      className={
                        acc.access === "bloqueado"
                          ? "text-gray-600"
                          : "text-gray-300"
                      }
                    >
                      {acc.label}
                    </span>
                    <span
                      className={`ml-auto text-[10px] ${
                        acc.access === "bloqueado"
                          ? "text-red-500/60"
                          : acc.access === "ver"
                            ? "text-yellow-500/60"
                            : "text-emerald-500/60"
                      }`}
                    >
                      {acc.access === "criar/editar"
                        ? "✎"
                        : acc.access === "ver"
                          ? "👁"
                          : "✕"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Balloon>
  );
}
