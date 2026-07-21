'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, LayoutDashboard, Trophy } from 'lucide-react'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <header className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 className="text-gradient">CreditTrack</h2>
          
          <nav className="nav-links">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path
              return (
                <Link key={item.path} href={item.path} className={`nav-link ${isActive ? 'active' : ''}`} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  paddingBottom: '0.25rem'
                }}>
                  <Icon size={18} color={isActive ? 'var(--accent-blue)' : 'currentColor'} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={16} />
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div className="container" style={{ padding: 0 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
