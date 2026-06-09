'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2342] to-[#1F5FA6]
                    flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-white text-4xl font-bold tracking-widest mb-1">IDEALZ</div>
          <div className="text-[#00B4D8] text-sm">Marketing Analytics System</div>
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
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                     required placeholder="name@idealz.lk"
                     className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Password
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
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
                    className="w-full bg-[#1F5FA6] text-white py-2.5 rounded-lg text-sm font-medium
                               hover:bg-blue-700 transition-colors flex items-center justify-center gap-2
                               disabled:opacity-60">
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
