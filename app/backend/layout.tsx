import type { ReactNode } from "react"
import { FixedBackButton } from "@/app/_components/FixedBackButton"

/** Every backend lesson + whole-map page gets the always-visible back pill. */
export default function BackendLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <FixedBackButton />
    </>
  )
}
