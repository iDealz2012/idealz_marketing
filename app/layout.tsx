'use client'
import './globals.css'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, TrendingUp, BarChart3, Target,
  Users, Upload, Bell, LogOut, Menu, X, ChevronRight,
  Settings2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/monthly', label: 'Monthly Analysis', icon: TrendingUp },
  { href: '/channels', label: 'Channel Comparison', icon: BarChart3 },
  { href: '/campaigns', label: 'Campaigns', icon: Target },
  { href: '/influencers', label: 'Influencers', icon: Users },
  { href: '/upload', label: 'Upload Data', icon: Upload },
  { href: '/budget', label: 'Budget Settings', icon: Settings2 },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState(0)
  const [month, setMonth] = useState('')
  const [budget, setBudget] = useState<number | null>(null)
  const isAuth = !pathname?.startsWith('/login')

  useEffect(() => {
    const d = new Date()
    const currentMonth = d.toISOString().slice(0, 7)
    setMonth(d.toLocaleString('default', { month: 'long', year: 'numeric' }))

    if (isAuth) {
      const sb = createClient()

      // Load unresolved alert count
      sb.from('alerts').select('id', { count: 'exact' })
        .eq('resolved', false)
        .then(({ count }) => setAlerts(count || 0))

      // Load this month's budget dynamically
      sb.from('monthly_budget').select('budget')
        .eq('month', currentMonth).single()
        .then(({ data }) => setBudget(data?.budget || null))
    }
  }, [pathname, isAuth])

  if (!isAuth) return <html lang="en"><body>{children}</body></html>

  const fmtBudget = (v: number) =>
    v >= 1000000 ? `Rs. ${(v / 1000000).toFixed(2)}M` : `Rs. ${(v / 1000).toFixed(0)}K`

  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden">

        {open && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setOpen(false)} />
        )}

        {/* ── SIDEBAR ── */}
        <aside className={`
          fixed top-0 left-0 h-full w-60 z-50 flex flex-col
          transition-transform duration-300 lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `} style={{ background: 'linear-gradient(180deg,#0A2342 0%,#0d2d56 100%)' }}>

          {/* Logo */}
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Image src="/logo.png" alt="Idealz" width={130} height={54}
                  className="object-contain" priority />
                <div className="text-xs mt-1 font-medium" style={{ color: '#00B4D8' }}>
                  Marketing Analytics
                </div>
              </div>
              <button className="lg:hidden text-white/50 hover:text-white ml-2"
                onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Month + budget */}
          <div className="px-5 py-2.5 border-b border-white/5"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs text-slate-400">{month}</div>
            {budget !== null ? (
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#00B4D8' }}>
                Budget: {fmtBudget(budget)}
              </div>
            ) : (
              <Link href="/budget"
                className="text-xs mt-0.5 block text-amber-400 hover:text-amber-300">
                ⚠ Set this month's budget →
              </Link>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href)
              return (
                <Link key={href} href={href}
                  className={`nav-link ${active ? 'active' : ''}`}
                  onClick={() => setOpen(false)}>
                  <Icon size={16} />
                  <span className="flex-1 text-sm">{label}</span>
                  {href === '/upload' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'rgba(0,180,216,0.2)', color: '#00B4D8' }}>
                      Monthly
                    </span>
                  )}
                  {href === '/budget' && budget === null && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                  {active && href !== '/budget' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] shrink-0" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Alert banner */}
          {alerts > 0 && (
            <div className="mx-3 mb-2 rounded-lg px-3 py-2.5 flex items-center gap-2"
              style={{ background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)' }}>
              <Bell size={14} className="text-red-400 shrink-0" />
              <span className="text-red-300 text-xs">
                {alerts} unresolved alert{alerts !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="px-3 pb-4 pt-3 border-t border-white/10">
            <button className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
              <LogOut size={16} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-white border-b border-slate-200 flex items-center
                             px-4 gap-4 shrink-0 shadow-sm">
            <button className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-semibold text-slate-700">
                <span className="text-slate-800">!</span>
                <span style={{ color: '#1F5FA6' }}>D</span>
                <span className="text-slate-800">ealz</span>
              </span>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="text-slate-500">
                {NAV.find(n => pathname?.startsWith(n.href))?.label || 'Dashboard'}
              </span>
            </div>

            <div className="flex-1" />

            {/* Dynamic budget pill */}
            {budget !== null ? (
              <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                              bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                {month.split(' ')[0]} Budget: {fmtBudget(budget)}
              </div>
            ) : (
              <Link href="/budget"
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                           bg-amber-50 text-amber-700 border border-amber-200 font-semibold hover:bg-amber-100">
                ⚠ Set monthly budget
              </Link>
            )}

            <Link href="/dashboard"
              className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
              <Bell size={18} />
              {alerts > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white
                                 text-[9px] rounded-full flex items-center justify-center font-bold">
                  {alerts > 9 ? '9+' : alerts}
                </span>
              )}
            </Link>
          </header>

          <main className="flex-1 overflow-y-auto p-5 lg:p-6">
            {children}
          </main>
        </div>

      </body>
    </html>
  )
}