// src/components/theme-toggle.tsx
"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Chỉ render sau khi component đã mount
  // Để tránh hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
        <span className="sr-only">Loading theme</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  )
}

// Variant với dropdown (light/dark/system)
export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Toggle theme"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-36 rounded-md border border-border bg-popover shadow-lg z-50">
            <div className="p-1">
              <button
                onClick={() => {
                  setTheme("light")
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${
                  theme === "light" ? "bg-accent" : ""
                }`}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => {
                  setTheme("dark")
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${
                  theme === "dark" ? "bg-accent" : ""
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => {
                  setTheme("system")
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${
                  theme === "system" ? "bg-accent" : ""
                }`}
              >
                💻 System
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}