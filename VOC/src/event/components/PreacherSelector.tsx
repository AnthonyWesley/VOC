import { useState, useEffect } from "react";
import Avatar from "../../components/Avatar";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import useMembers from "../../member/hooks/useMembers";
import { FormInput } from "../../components/FormInput";

type Preacher = {
  id: string;
  fullName: string;
  email?: string;
  photoUrl?: string | null;
};

export default function PreacherSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: Preacher | null;
  onChange: (member: Preacher) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState(value?.fullName ?? "");
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { queryMembers } = useMembers({
    mode: "all",
    status: "ACTIVE",
    search: debouncedSearch,
  });

  const members = queryMembers.data?.pages.flatMap((page) => page.data) ?? [];
  const isLoading = queryMembers.isLoading;

  useEffect(() => {
    setSearch(value?.fullName ?? "");
  }, [value]);

  return (
    <div>
      <header className="flex w-full items-center justify-between gap-4">
        <Avatar
          image={value?.photoUrl ?? undefined}
          name={value?.fullName ?? "-"}
          size="48"
          className="rounded-full bg-gray-800"
        />

        <FormInput
          placeholder="Buscar pregador"
          icon="mdi:microphone-variant"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="flex-1"
          disabled={disabled}
        />
      </header>

      {showDropdown && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-700 bg-gray-900 shadow-lg">
          {isLoading ? (
            <li className="px-3 py-2 text-sm text-gray-400">Carregando...</li>
          ) : members.length > 0 ? (
            members.map((member) => (
              <li
                key={member.id}
                onClick={() => {
                  onChange({
                    id: member.id,
                    fullName: member.fullName,
                    photoUrl: member.photoUrl ?? undefined,
                  });
                  setSearch(member.fullName);
                  setShowDropdown(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-700"
              >
                <Avatar
                  image={member.photoUrl ?? undefined}
                  name={member.fullName}
                  size="32"
                  className="rounded-full bg-gray-700 text-[var(--text-primary)]"
                />
                <div className="flex flex-col">
                  <p className="text-sm text-[var(--text-primary)]">{member.fullName}</p>
                  <p className="text-xs text-gray-400">{member.fullName}</p>
                </div>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-400">
              Nenhum resultado
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
