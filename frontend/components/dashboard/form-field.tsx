"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { DASH } from "./theme";

const CONTROL_CLASS =
  "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#8A1253]/15";

export function FieldLabel({
  htmlFor,
  children,
  required,
  optional,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[15px] font-bold"
      style={{ color: DASH.heading }}
    >
      {children}
      {required && <span style={{ color: "#DC2626" }}> *</span>}
      {optional && (
        <span className="font-normal" style={{ color: DASH.muted }}>
          {" "}
          (Optional)
        </span>
      )}
    </label>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 text-[13px] leading-snug" style={{ color: DASH.muted }}>
      {children}
    </p>
  );
}

export function TextField({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={CONTROL_CLASS}
      style={{ borderColor: DASH.border }}
    />
  );
}

export function SelectField({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL_CLASS} appearance-none pr-11`}
        style={{ borderColor: DASH.border }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: DASH.muted }}
      />
    </div>
  );
}

export function TextAreaField({
  id,
  value,
  onChange,
  rows = 4,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${CONTROL_CLASS} resize-y`}
      style={{ borderColor: DASH.border }}
    />
  );
}
