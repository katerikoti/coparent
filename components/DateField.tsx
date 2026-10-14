"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { nativeToText, textToNative, type DateFieldMode } from "@/lib/dateInput";

/**
 * Date/time text field that always displays values as dd.MM.yyyy / HH:mm,
 * independent of the browser locale. A small button opens the native picker
 * (via showPicker) as a convenience; typed input is always in our format.
 */
export default function DateField({
  mode = "date",
  value,
  onChange,
  placeholder,
  className = "",
}: {
  mode?: DateFieldMode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const ref = useRef<HTMLInputElement>(null);
  const nativeType = mode === "datetime" ? "datetime-local" : mode;

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        aria-label={t("openPicker")}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (typeof el.showPicker === "function") {
            try {
              el.showPicker();
            } catch {
              el.focus();
            }
          } else {
            el.focus();
          }
        }}
        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-violet-600"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
      <input
        ref={ref}
        type={nativeType}
        value={textToNative(value, mode)}
        onChange={(e) => onChange(nativeToText(e.target.value, mode))}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
    </div>
  );
}
