import React, { forwardRef, useState, useEffect } from "react";

type InputSearchProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onOpenChange?: (isOpen: boolean) => void;
  value: string;
};

const InputSearch = forwardRef<HTMLInputElement, InputSearchProps>(
  ({ onOpenChange, value, ...props }, ref) => {
    const [inputValue, setInputValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const isOpen = isFocused || isHovered || value.length > 0;

    useEffect(() => {
      setInputValue(value);
    }, [value]);

    useEffect(() => {
      onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    return (
      <div
        className={`flex h-[55px] w-[55px] items-center overflow-hidden rounded-full bg-slate-950 p-4 shadow-[2px_2px_20px_rgba(0,0,0,0.08)] duration-300 ${
          isOpen ? "w-full" : "w-[50px]"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center fill-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path d="M18.9,16.776A10.539,10.539,0,1,0,16.776,18.9l5.1,5.1L24,21.88ZM10.5,18A7.5,7.5,0,1,1,18,10.5,7.507,7.507,0,0,1,10.5,18Z" />
          </svg>
        </div>
        <input
          type="text"
          className="w-full bg-transparent px-4 text-[20px] font-normal text-[var(--text-primary)] outline-none"
          ref={ref}
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            setInputValue(e.target.value);
            props.onChange?.(e);
          }}
          {...props}
        />
      </div>
    );
  },
);

export default InputSearch;
