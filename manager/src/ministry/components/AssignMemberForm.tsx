import { useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import useMembers from "../../member/hooks/useMembers";
import { calculateAge } from "../../helpers/calculateAge";
import { useMinistryMutations } from "../hooks/useMemberMutations";
import { useEventMutations } from "../../event/hooks/useEventMutations";
import { ListModeType } from "../../member/types/memberTypes";

import { PageHeader } from "../../components/PageHeader";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import Card from "../../components/Card";

type AssignMemberFormProps = {
  targetId: string;
  where: ListModeType;
  ministryId?: string;
  onSuccess?: () => void;
};

export default function AssignMemberForm({
  targetId,
  where,
  ministryId,
}: AssignMemberFormProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { assignMember: assignToMinistry } = useMinistryMutations();
  const { assignMember: assignToEvent } = useEventMutations();

  const {
    queryMembers: { data, isLoading },
  } = useMembers({
    mode: where,
    eventId: where !== "ministry" ? targetId : undefined,
    ministryId: where === "ministry" ? targetId : where !== "event" ? ministryId : undefined,
    search: debouncedSearch,
    status: "ACTIVE",
  });

  const members = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="p-6 text-center text-[var(--text-primary)]">
        Carregando membros disponíveis...
      </div>
    );
  }

  return (
    <Card className="">
      {/* 🔥 Header */}
      <PageHeader
        icon="mdi:account-plus"
        title="Adicionar Membros"
        subtitle="Selecione membros para adicionar"
      />

      <div className="space-y-4 p-6">
        {/* 🔍 Campo de busca */}
        <FormInput
          label="Buscar"
          icon="mdi:magnify"
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Lista */}
        <ul className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
          {members.map((m) => {
            const age = calculateAge(m.birthDate);

            return (
              <li
                key={m.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 md:flex-row md:items-center md:justify-between"
              >
                {/* LEFT */}
                <div className="flex flex-col gap-1 text-[var(--text-primary)]">
                  <span className="font-semibold">{m.fullName}</span>
                  <span className="text-xs text-slate-400">
                    Idade: {age ?? "-"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {m.phone ?? "-"}
                  </span>
                </div>

                {/* RIGHT */}
                <FormButton
                  label="Add"
                  icon="mdi:plus"
                  className="w-full md:w-auto"
                  isPending={
                    assignToEvent.isPending || assignToMinistry.isPending
                  }
                  onClick={() => {
                    if (where === "event") {
                      assignToEvent.mutate({
                        memberId: m.id,
                        eventId: targetId,
                      });
                    } else if (where === "ministry") {
                      assignToMinistry.mutate({
                        memberId: m.id,
                        ministryId: targetId,
                      });
                    } else if (where === "assignment") {
                      assignToEvent.mutate({
                        memberId: m.id,
                        eventId: targetId,
                        ministryId: ministryId ?? "",
                      });
                    }
                  }}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
