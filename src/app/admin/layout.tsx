'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Users, Calendar, Award, Home, Activity, Shield, Menu, X } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Admins', path: '/admin/admins', icon: Shield },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Record Results', path: '/admin/record-results', icon: Award },
    { name: 'Activity Log', path: '/admin/activity-log', icon: Activity },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mobile Topbar */}
      <header className="mobile-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-surface-glass)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="text-gradient" style={{ fontSize: '1.25rem', margin: 0 }}>CreditTrack Admin</h2>
        <button className="btn btn-secondary" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '0.5rem' }}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar */}
        <aside className={`glass-card sidebar ${sidebarOpen ? 'open' : ''}`} style={{ 
          width: '250px', borderTop: 'none', borderLeft: 'none', borderBottom: 'none', 
          borderRadius: 0, padding: '2rem 1rem', display: 'flex', flexDirection: 'column'
        }}>
          <div className="sidebar-header" style={{ marginBottom: '2rem', padding: '0 1rem' }}>
            <h2 className="text-gradient">Admin Panel</h2>
          </div>
          
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path
              return (
                <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: '8px', color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease', fontWeight: 500
                }}>
                  <Icon size={18} color={isActive ? 'var(--accent-blue)' : 'currentColor'} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <button onClick={handleLogout} className="btn btn-secondary" style={{ marginTop: 'auto', border: 'none', justifyContent: 'flex-start' }}>
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        {/* Sidebar Overlay (Mobile) */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="main-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div className="container" style={{ padding: 0 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
