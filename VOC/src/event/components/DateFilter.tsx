interface Props {
  startDate?: string;
  endDate?: string;
  onChange: (value: { startDate?: string; endDate?: string }) => void;
}

export function DateFilter({ startDate, endDate, onChange }: Props) {
  return (
    <>
      <input
        type="date"
        value={startDate ?? ""}
        onChange={(e) =>
          onChange({ startDate: e.target.value || undefined, endDate })
        }
        className="input input-bordered rounded bg-gray-800 px-3 py-2 text-sm text-gray-200"
      />

      <input
        type="date"
        value={endDate ?? ""}
        onChange={(e) =>
          onChange({ startDate, endDate: e.target.value || undefined })
        }
        className="input input-bordered rounded bg-gray-800 px-3 py-2 text-sm text-gray-200"
      />
    </>
  );
}
