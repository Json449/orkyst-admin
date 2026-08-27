"use client"

import Image from "next/image"

export function OrkystLogo({ className = "h-auto w-32" }: { className?: string }) {
  return <Image src="/logo.svg" alt="Orkyst" priority width={215} height={48} className={className} />
}

export function OrkystMark({ className = "h-8 w-8" }: { className?: string }) {
  return <Image src="/Orkystt.svg" alt="" aria-hidden priority width={180} height={180} className={className} />
}
