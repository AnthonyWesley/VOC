import { Icon } from "@iconify/react/dist/iconify.js";
import { forwardRef, InputHTMLAttributes, useState } from "react";

interface InputLabelProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  isPassword?: boolean;
}

const InputLabel = forwardRef<HTMLInputElement, InputLabelProps>(
  ({ label, className, isPassword = false, ...props }, ref) => {
    const [show, setShow] = useState(isPassword);

    return (
      <label className="flex w-full flex-col">
        <h1 className="text-slate-500">{label}</h1>
        <section
          className={`flex w-full rounded bg-white/5 text-[var(--text-primary)] placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none ${className ?? ""}`}
        >
          <input
            ref={ref}
            {...props}
            type={show ? "password" : "text"}
            // className="no-eye w-full border-none outline-none"
            className="no-eye w-full rounded-s border-none p-2 outline-none"
          />
          {isPassword && (
            <button
              type="button"
              className="cursor-pointer px-2 text-[120%] text-cyan-400"
              onClick={() => setShow(!show)}
            >
              {show ? (
                <Icon icon="tabler:eye-off" />
              ) : (
                <Icon icon="tabler:eye" />
              )}
            </button>
          )}
        </section>
      </label>
    );
  },
);

InputLabel.displayName = "InputLabel";

export default InputLabel;
