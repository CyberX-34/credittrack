'use client'

import { useState, useEffect } from 'react'
import { Users, Calendar, Award, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading dashboard...</div>

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, Admin.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#60A5FA' }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Total Students</p>
              <h2 style={{ fontSize: '2rem' }}>{stats.totalStudents}</h2>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '12px', color: '#2DD4BF' }}>
              <Calendar size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Events Conducted</p>
              <h2 style={{ fontSize: '2rem' }}>{stats.totalEvents}</h2>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#FBBF24' }}>
              <Award size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Credits Awarded</p>
              <h2 style={{ fontSize: '2rem' }}>{stats.totalCreditsAwarded}</h2>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {stats.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Admin</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((log: any) => (
                  <tr key={log.id}>
                    <td>{log.action.replace(/_/g, ' ')}</td>
                    <td>{log.admin?.name || 'Unknown'}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No recent activity to show.
          </div>
        )}
      </div>
    </div>
  )
}
