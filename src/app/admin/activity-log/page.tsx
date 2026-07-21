'use client'

import { useState, useEffect } from 'react'

export default function ActivityLog() {
  const [data, setData] = useState<{ activities: any[], attendances: any[], results: any[] }>({ activities: [], attendances: [], results: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('LOGS') // 'LOGS' | 'CORRECTIONS'
  const [correcting, setCorrecting] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const fetchData = () => {
    fetch('/api/admin/activities')
      .then(res => res.json())
      .then(resData => {
        if (!resData.error) setData(resData)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleReverse = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to reverse this entry? This will permanently deduct the awarded points.')) return
    
    setCorrecting(id)
    setMessage('')
    try {
      const res = await fetch('/api/admin/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id })
      })
      if (!res.ok) {
        const errorData = await res.json()
        setMessage(`Error: ${errorData.error}`)
      } else {
        setMessage('Successfully reversed record.')
        fetchData()
      }
    } catch (err) {
      setMessage('An error occurred during reversal.')
    } finally {
      setCorrecting(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Activity & Audit Log</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View system activity and reverse incorrect entries.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeTab === 'LOGS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('LOGS')}
        >
          System Activity
        </button>
        <button 
          className={`btn ${activeTab === 'CORRECTIONS' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ background: activeTab === 'CORRECTIONS' ? 'rgba(239, 68, 68, 0.2)' : '', color: activeTab === 'CORRECTIONS' ? '#EF4444' : '' }}
          onClick={() => setActiveTab('CORRECTIONS')}
        >
          Make Corrections
        </button>
      </div>

      {message && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)' }}>
          {message}
        </div>
      )}

      {activeTab === 'LOGS' ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                ) : data.activities.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No activity logs found.</td></tr>
                ) : (
                  data.activities.map((log) => (
                    <tr key={log.id}>
                      <td><span className="badge badge-blue">{log.action}</span></td>
                      <td>{log.admin?.name || 'Unknown'}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '300px', overflowX: 'auto' }}>
                        <code>{log.details}</code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#EF4444' }}>Recent Attendance (Eligible for Reversal)</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.attendances.map(a => (
                  <tr key={a.id}>
                    <td>{a.student?.name} ({a.student?.rollNo})</td>
                    <td>{a.sessionId}</td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        disabled={correcting === a.id}
                        onClick={() => handleReverse('ATTENDANCE', a.id)}
                      >
                        {correcting === a.id ? 'Reversing...' : 'Reverse'}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.attendances.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center' }}>No recent attendance records.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#EF4444' }}>Recent Event Results (Eligible for Reversal)</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Recipient</th>
                  <th>Position</th>
                  <th>Pts Awarded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map(r => (
                  <tr key={r.id}>
                    <td>{r.event?.name}</td>
                    <td>{r.student ? `${r.student.name} (Solo)` : `Team: ${r.team?.teamName || 'Unnamed'}`}</td>
                    <td>{r.position || 'Participation'}</td>
                    <td>{r.pointsAwarded}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        disabled={correcting === r.id}
                        onClick={() => handleReverse('RESULT', r.id)}
                      >
                        {correcting === r.id ? 'Reversing...' : 'Reverse'}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No recent result records.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
