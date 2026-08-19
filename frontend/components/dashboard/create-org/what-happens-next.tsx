"use client";

import { Check } from "lucide-react";
import { DASH } from "../theme";

const OUTCOMES = [
  "Invitation is sent to the owner",
  "Owner sets up their own account",
  "Command Center is created",
  "Owner invites their team",
  "Content scheduling begins",
];

export function WhatHappensNext() {
  return (
    <div
      className="rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <h2
        className="border-b px-6 py-5 text-[17px] font-bold"
        style={{ borderColor: DASH.border, color: DASH.heading }}
      >
        What happens next?
      </h2>

      <ul className="space-y-5 px-6 py-6">
        {OUTCOMES.map((outcome) => (
          <li key={outcome} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]">
              <Check className="h-3.5 w-3.5" style={{ color: DASH.subtle }} />
            </span>
            <span className="text-[15px]" style={{ color: DASH.heading }}>
              {outcome}
            </span>
          </li>
        ))}
      </ul>

      <div
        className="border-t px-6 py-5 text-[15px]"
        style={{ borderColor: DASH.border, color: DASH.muted }}
      >
        Typical time to first post:{" "}
        <span className="font-bold" style={{ color: DASH.heading }}>
          4 days
        </span>
      </div>
    </div>
  );
}
