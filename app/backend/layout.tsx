import type { ReactNode } from "react"
import { FixedBackButton } from "@/app/_components/FixedBackButton"

/** Shared chrome for every backend lesson + whole-map page: the content
    column and the always-visible back pill. */
export default function BackendLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
        {children}
      </main>
      <FixedBackButton />
    </>
  )
}
