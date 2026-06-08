import type { ReactNode } from "react"
import { FixedBackButton } from "@/app/_components/FixedBackButton"

/** Every reference field-guide page gets the always-visible back pill. */
export default function ReferenceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <FixedBackButton />
    </>
  )
}
