"use client";

import { InputHTMLAttributes, useRef } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
  loading?: boolean;
  containerClassName?: string;
}

export default function SearchBar({
  className,
  containerClassName,
  value,
  onClear,
  loading,
  placeholder = "ابحث...",
  ...props
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "relative flex items-center bg-white border border-surface-border rounded-xl",
        "focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20",
        "transition-all duration-150",
        containerClassName
      )}
    >
      {/* Search icon */}
      <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
        {loading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </span>

      <input
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder}
        className={cn(
          "w-full py-2.5 pe-10 ps-4 bg-transparent text-stone-900 text-sm",
          "placeholder:text-stone-400 focus:outline-none",
          value && onClear && "ps-8",
          className
        )}
        {...props}
      />

      {/* Clear button */}
      {value && onClear && (
        <button
          type="button"
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          className="absolute start-3 top-1/2 -translate-y-1/2 text-stone-400
                     hover:text-stone-600 transition-colors p-0.5 rounded"
          aria-label="مسح البحث"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
