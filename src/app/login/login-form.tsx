// src/app/login/login-form.tsx
'use client' // Đánh dấu đây là Client Component

import { createClient } from '@/lib/supabase/client' // Import client cho client
import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClient()

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    
    if (error) {
      console.error('Lỗi đăng nhập:', error.message)
    } else {
      console.log('Đăng nhập thành công:', data.user)
      // Next.js sẽ tự động điều hướng hoặc refresh
    }
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button onClick={handleLogin}>Đăng nhập</button>
    </div>
  )
}