"use client";

import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { DASH } from "../theme";

/** Pink advisory banner used at the foot of each wizard step. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      className="mt-6 flex items-start gap-3 rounded-xl p-5"
      style={{ backgroundColor: "#FDF2F8" }}
    >
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" style={{ color: DASH.accent }} />
      <p className="text-[15px] leading-relaxed" style={{ color: DASH.accent }}>
        {children}
      </p>
    </div>
  );
}
