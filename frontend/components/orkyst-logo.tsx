"use client"

export function OrkystLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Layered geometric squares - Orkyst brand mark */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="4"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <rect
        x="8"
        y="8"
        width="24"
        height="24"
        rx="4"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="12"
        y="12"
        width="24"
        height="24"
        rx="4"
        fill="currentColor"
        fillOpacity="0.8"
      />
      {/* Inner accent lines */}
      <path
        d="M18 20L22 24L30 16"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
