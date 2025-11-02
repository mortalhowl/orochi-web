// ============================================
// src/app/login/page.tsx (Login Page)
// ============================================
import { GoogleSignInButton } from '@/components/auth/google-signin-button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Nếu đã login thì redirect về home
  if (user) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to Orochi</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>
        
        <GoogleSignInButton />
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}