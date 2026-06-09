'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  // If already logged in redirect to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/dashboard')
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/budget')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0A2342 0%, #1F5FA6 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-2">
            <img src="/logo.png" alt="Idealz" className="h-14 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const next = e.currentTarget.nextElementSibling as HTMLElement
                if (next) next.style.display = 'block'
              }} />
            <div style={{ display: 'none' }}>
              <span className="text-4xl font-black text-white">!</span>
              <span className="text-4xl font-black" style={{ color: '#4A9FE8' }}>D</span>
              <span className="text-4xl font-black text-white">ealz</span>
            </div>
          </div>
          <div className="text-sm font-medium" style={{ color: '#00B4D8' }}>
            Marketing Analytics System
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">Sign In</h1>
              <p className="text-xs text-slate-400">Team members only</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Email address
              </label>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required placeholder="name@idealz.lk"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Password
              </label>
              <input type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full text-white py-2.5 rounded-lg text-sm font-medium
                         hover:opacity-90 transition-all flex items-center justify-center gap-2
                         disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0A2342, #1F5FA6)' }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Idealz Lanka — Marketing Analytics v1.0
        </p>
      </div>
    </div>
  )
}
