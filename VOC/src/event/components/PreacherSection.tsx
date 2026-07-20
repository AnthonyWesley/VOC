import PreacherSelector from "../components/PreacherSelector";

type Props = {
  preacher: any;
  setFormValues: React.Dispatch<React.SetStateAction<any>>;
  readOnly?: boolean;
};

export default function PreacherSection({
  preacher,
  setFormValues,
  readOnly = false,
}: Props) {
  const handleChange = (value: any) => {
    setFormValues((prev: any) => ({
      ...prev,
      preacher: value,
    }));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pregador</h2>

      <PreacherSelector
        value={preacher}
        onChange={handleChange}
        disabled={readOnly}
      />
    </div>
  );
}
