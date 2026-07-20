import { FormInput } from "../../components/FormInput";

type Props = {
  formValues: any;
  setFormValues: React.Dispatch<React.SetStateAction<any>>;
  readOnly?: boolean;
};

export default function EventAttendanceSection({
  formValues,
  setFormValues,
  readOnly = false,
}: Props) {
  const handleAttendanceChange = (field: string, value: number) => {
    setFormValues((prev: any) => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [field]: value,
      },
    }));
  };

  return (
    <>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Presença</h2>

      <div className="my-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <FormInput
          label="Membros"
          icon="mdi:account-group-outline"
          type="number"
          value={formValues.attendance.membersCount}
          onChange={(e) =>
            handleAttendanceChange("membersCount", Number(e.target.value))
          }
          disabled={readOnly}
        />

        <FormInput
          label="Visitantes"
          icon="mdi:account-plus-outline"
          type="number"
          value={formValues.attendance.visitorsCount}
          onChange={(e) =>
            handleAttendanceChange("visitorsCount", Number(e.target.value))
          }
          disabled={readOnly}
        />
      </div>
    </>
  );
}
