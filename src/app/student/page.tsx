'use client'

import { useState, useEffect } from 'react'
import { Award, Target, Flame, Bell, X } from 'lucide-react'

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/student/profile')
      .then(res => res.json())
      .then(resData => {
        if (!resData.error) {
          setData(resData)
          if (resData.notifications && resData.notifications.length > 0) {
            setNotifications(resData.notifications)
            // Mark as read
            fetch('/api/student/notifications/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notificationIds: resData.notifications.map((n: any) => n.id) })
            })
          }
        }
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading your dashboard...</div>
  if (!data) return <div>Error loading profile.</div>

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <div className="animate-fade-in">
      {/* Notifications Toast */}
      {notifications.map((n, idx) => (
        <div key={n.id} className="toast" style={{ bottom: `${2 + (idx * 5)}rem` }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '50%', color: '#60A5FA' }}>
            <Bell size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>New Award</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{n.message}</p>
          </div>
          <button onClick={() => dismissNotification(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '1rem' }}>
            <X size={18} />
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Hi, {data.profile.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{data.profile.branch} • Year {data.profile.year}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ padding: '1rem', background: 'var(--gradient-primary)', borderRadius: '50%', color: 'white', marginBottom: '1rem', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
            <Award size={32} />
          </div>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Total Credits</h3>
          <h2 style={{ fontSize: '3.5rem', lineHeight: 1, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {data.profile.totalCredits}
          </h2>
          {data.lastUpdated && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ padding: '1rem', background: 'var(--gradient-gold)', borderRadius: '50%', color: 'white', marginBottom: '1rem', boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}>
            <Target size={32} />
          </div>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Global Rank</h3>
          <h2 style={{ fontSize: '3.5rem', lineHeight: 1, color: '#FBBF24' }}>
            #{data.rank}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Flame color="#EF4444" size={20} />
            <h3 style={{ fontSize: '1.1rem' }}>Achievements</h3>
          </div>
          {data.badges.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {data.badges.map((badge: any) => (
                <div key={badge.id} className={`badge badge-${badge.type === 'gold' ? 'gold' : badge.type === 'silver' ? 'silver' : 'bronze'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  {badge.name}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>No achievements yet. Keep participating!</p>
          )}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Attendance Count</span>
             <span style={{ fontWeight: 600 }}>{data.attendanceCount}</span>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Activity History</h3>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {data.history.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Result</th>
                  <th>Points Earned</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((record: any) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 500 }}>{record.event?.name}</td>
                    <td>
                      <span className={`badge ${record.eventType === 'SOLO' ? 'badge-blue' : 'badge-gold'}`}>
                        {record.eventType === 'GROUP' && record.teamName ? `${record.eventType} (${record.teamName})` : record.eventType}
                      </span>
                    </td>
                    <td>{record.position ? `${record.position}${record.position === 1 ? 'st' : record.position === 2 ? 'nd' : record.position === 3 ? 'rd' : 'th'} Place` : 'Participation'}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>+{record.pointsAwarded}</td>
                    <td>{new Date(record.event.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ opacity: 0.3, marginBottom: '1rem' }}>
              <Award size={48} />
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>No event history</h4>
            <p style={{ color: 'var(--text-secondary)' }}>You haven't been awarded any event credits yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
