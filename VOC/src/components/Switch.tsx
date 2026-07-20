type SwitchProps = {
  checked?: boolean;
  onChange: (checked: boolean) => void;
};

export default function Switch({ checked, onChange }: SwitchProps) {
  return (
    <div className="relative box-border h-10 w-20 items-center rounded-full bg-slate-950 p-[3px] shadow-[inset_0_1px_1px_1px_rgba(0,0,0,0.5),0_1px_0_0_rgba(255,255,255,0.1)]">
      <input
        id="toggle"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />

      {/* knob */}
      <label
        htmlFor="toggle"
        className={`flex h-full w-1/2 items-center justify-center rounded-full bg-slate-900 transition-all duration-500 peer-checked:translate-x-full`}
      >
        {/* Glow point */}
        <span
          className={`block h-1.5 w-1.5 rounded-full transition-all duration-500 ${
            checked
              ? "bg-white shadow-[0_0_5px_2px_rgba(15,165,70,0.9),0_0_3px_1px_rgba(15,165,70,0.9)]"
              : "bg-white shadow-[0_0_5px_2px_rgba(165,15,15,0.9),0_0_3px_1px_rgba(165,15,15,0.9)]"
          } `}
        />
      </label>
    </div>
  );
}
