"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, title: "Welcome", subtitle: "The Divine Arena" },
  { id: 2, title: "Agents", subtitle: "The Pantheon" },
  { id: 3, title: "Arena", subtitle: "The Battlefield" },
  { id: 4, title: "Economy", subtitle: "The Treasury" },
  { id: 5, title: "Results", subtitle: "The Verdict" },
]

interface StepIndicatorProps {
  currentStep: number
  onStepClick: (step: number) => void
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep
        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={cn(
              "relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors",
              isActive
                ? "text-primary"
                : isCompleted
                ? "text-primary/60 hover:text-primary/80"
                : "text-muted-foreground/40 hover:text-muted-foreground/60"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="step-active-bg"
                className="absolute inset-0 rounded-full bg-primary/15 divine-border"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-mono border transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : isCompleted
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-muted/30 border-border/30"
              )}
            >
              {step.id}
            </span>
            <span className="relative z-10 hidden md:inline font-serif">{step.title}</span>
          </button>
        )
      })}
    </div>
  )
}
