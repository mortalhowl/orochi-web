// ============================================
// src/app/auth/auth-code-error/page.tsx
// ============================================
import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md p-8 bg-card border border-border rounded-lg text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Authentication Error
        </h1>
        <p className="text-muted-foreground mb-6">
          There was an error during the authentication process. Please try again.
        </p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}