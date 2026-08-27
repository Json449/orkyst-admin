"use client"

import Image from "next/image"
import orkystWordmark from "../../../frontend/public/logo.svg"
import orkystMark from "../../../frontend/public/Orkystt.svg"

export function OrkystLogo({ className = "h-auto w-32" }: { className?: string }) {
  return <Image src={orkystWordmark} alt="Orkyst" priority className={className} />
}

export function OrkystMark({ className = "h-8 w-8" }: { className?: string }) {
  return <Image src={orkystMark} alt="" aria-hidden priority className={className} />
}
