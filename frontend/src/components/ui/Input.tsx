import { cn } from "@/lib/utils";
import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;   // Icon or text inside left of input
  suffix?: ReactNode;   // Icon or text inside right of input
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, prefix, suffix, required, ...props }, ref) => {
    const inputId = id ?? (label ? `field-${label}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
            {required && (
              <span className="text-danger-500 mr-1" aria-hidden>*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "field-input",
              error && "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500",
              prefix && "pe-10",
              suffix && "ps-10",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="field-error">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="field-hint">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
