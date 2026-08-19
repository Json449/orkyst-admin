"use client";

import type { ReactNode } from "react";
import { DASH } from "../theme";

/** Large selectable card used for the invitation choice. */
export function RadioCard({
  name,
  checked,
  onSelect,
  title,
  children,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <label
      className="flex cursor-pointer gap-4 rounded-xl p-5 transition-colors"
      style={{
        backgroundColor: checked ? "#FDF2F8" : "#FFFFFF",
        boxShadow: `inset 0 0 0 ${checked ? 2 : 1}px ${checked ? DASH.plum : DASH.border}`,
      }}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{
          boxShadow: `inset 0 0 0 2px ${checked ? DASH.plum : "#D1D5DB"}`,
        }}
      >
        {checked && (
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: DASH.plum }}
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[16px] font-bold" style={{ color: DASH.heading }}>
          {title}
        </span>
        <span
          className="mt-1.5 block text-[15px] leading-relaxed"
          style={{ color: DASH.muted }}
        >
          {children}
        </span>
      </span>
    </label>
  );
}
