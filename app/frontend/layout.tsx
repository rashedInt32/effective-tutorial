import type { ReactNode } from "react"
import { FixedBackButton } from "@/app/_components/FixedBackButton"

/** Shared chrome for every frontend lesson: the content column and the
    always-visible back pill. Mirrors the backend layout exactly. */
export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
        {children}
      </main>
      <FixedBackButton />
    </>
  )
}
