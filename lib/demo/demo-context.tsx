"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { DemoMode } from "../types"

interface DemoModeContextType {
  mode: DemoMode
  setMode: (mode: DemoMode) => void
  toggleMode: () => void
  isDemo: boolean
  isLive: boolean
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined)

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DemoMode>("live")

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "demo" ? "live" : "demo"))
  }, [])

  return (
    <DemoModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isDemo: mode === "demo",
        isLive: mode === "live",
      }}
    >
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoModeProvider")
  }
  return context
}
