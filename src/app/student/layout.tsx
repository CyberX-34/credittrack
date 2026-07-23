'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, LayoutDashboard, Trophy, Menu, X, User } from 'lucide-react'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <h2 className="text-gradient">CreditTrack</h2>
          
          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', display: 'none' }}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <nav className="nav-links">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path
              return (
                <Link key={item.path} href={item.path} onClick={() => setMenuOpen(false)} className={`nav-link ${isActive ? 'active' : ''}`} style={{
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

          <button onClick={handleLogout} className="btn btn-secondary logout-btn" style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div className="container" style={{ padding: 0 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
