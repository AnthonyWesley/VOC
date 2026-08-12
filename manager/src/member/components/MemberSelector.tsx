import { useState, useEffect } from "react";
import Avatar from "../../components/Avatar";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import useMembers from "../hooks/useMembers";
import { FormInput } from "../../components/FormInput";

type Member = {
  id: string;
  fullName: string;
  photoUrl?: string | null;
};

export default function MemberSelector({
  value,
  onChange,
}: {
  value: Member | null;
  onChange: (member: Member) => void;
}) {
  const [search, setSearch] = useState(value?.fullName ?? "");
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { queryMembers } = useMembers({
    mode: "all",
    search: debouncedSearch,
    status: "ACTIVE",
  });

  const members = queryMembers.data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    setSearch(value?.fullName ?? "");
  }, [value]);

  return (
    <div className="relative w-full">
      <FormInput
        icon="mdi:account-group-outline"
        label="MEMBRO"
        placeholder="Buscar membro"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      />

      {showDropdown && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-700 bg-gray-900 shadow-lg">
          {members.length > 0 ? (
            members.map((m) => (
              <li
                key={m.id}
                onClick={() => {
                  onChange(m);
                  setSearch(m.fullName);
                  setShowDropdown(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-700"
              >
                <Avatar
                  image={m.photoUrl ?? undefined}
                  name={m.fullName}
                  size="32"
                  className="rounded-full bg-gray-700"
                />
                <p className="text-sm text-[var(--text-primary)]">{m.fullName}</p>
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
