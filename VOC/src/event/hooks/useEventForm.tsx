import { useState, useEffect } from "react";

export default function useEventForm(event: any) {
  const [formValues, setFormValues] = useState<any>(null);

  useEffect(() => {
    if (!event) return;

    setFormValues({
      title: event.title,
      type: event.type,
      startsAt: new Date(event.startsAt).toISOString().slice(0, 16),
      endsAt: event.endsAt
        ? new Date(event.endsAt).toISOString().slice(0, 16)
        : "",
      preacher: event.preacher ?? "",
      attendance: {
        membersCount: event.attendance?.membersCount ?? 0,
        visitorsCount: event.attendance?.visitorsCount ?? 0,
      },
      financialRecords: event.financialRecords ?? [],
      members: event.members ?? [],
    });
  }, [event]);

  const handleChange = (field: string, value: any) => {
    setFormValues((prev: any) => ({ ...prev, [field]: value }));
  };

  return {
    formValues,
    setFormValues,
    handleChange,
  };
}
