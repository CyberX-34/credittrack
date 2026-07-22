'use client'

import { useState, useEffect } from 'react'

export default function RecordResults() {
  const [events, setEvents] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    type: 'ATTENDANCE', // or 'RESULT'
    // Attendance fields
    studentId: '',
    sessionId: '',
    date: new Date().toISOString().split('T')[0],
    
    // Result fields
    eventId: '',
    position: '1', // 1, 2, 3, or null for participation
    pointsAwarded: 5,
    teamName: '',
    teamMemberIds: [] as string[]
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    fetch('/api/admin/events').then(res => res.json()).then(data => {
      if (!data.error) setEvents(data)
    })
    fetch('/api/admin/students').then(res => res.json()).then(data => {
      if (!data.error) setStudents(data)
    })
  }, [])

  const handlePositionChange = (val: string) => {
    let pts = 0
    if (val === '1') pts = 5
    if (val === '2') pts = 3
    if (val === '3') pts = 1
    if (val === 'null') pts = 0
    
    setFormData({ ...formData, position: val, pointsAwarded: pts })
  }

  const handleTeamMemberToggle = (id: string) => {
    const current = formData.teamMemberIds
    if (current.includes(id)) {
      setFormData({ ...formData, teamMemberIds: current.filter(x => x !== id) })
    } else {
      setFormData({ ...formData, teamMemberIds: [...current, id] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ text: '', type: '' })

    try {
      if (formData.type === 'ATTENDANCE') {
        const res = await fetch('/api/admin/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: formData.studentId,
            sessionId: formData.sessionId,
            date: formData.date
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setMessage({ text: 'Attendance recorded successfully!', type: 'success' })
      } else {
        const selectedEvent = events.find(ev => ev.id === formData.eventId)
        if (!selectedEvent) throw new Error('Please select an event')

        const payload: any = {
          eventId: formData.eventId,
          position: formData.position === 'null' ? null : parseInt(formData.position),
          pointsAwarded: formData.pointsAwarded
        }

        if (selectedEvent.type === 'SOLO') {
          payload.studentId = formData.studentId
          if (!payload.studentId) throw new Error('Please select a student')
        } else {
          payload.teamMemberIds = formData.teamMemberIds
          payload.teamName = formData.teamName
          if (payload.teamMemberIds.length === 0) throw new Error('Please select team members')
        }

        const res = await fetch('/api/admin/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setMessage({ text: 'Result recorded successfully!', type: 'success' })
      }
      
      // Reset form specific parts
      setFormData({ ...formData, studentId: '', teamMemberIds: [], teamName: '' })
    } catch (err: any) {
      setMessage({ text: err.message || 'An error occurred', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedEvent = events.find(ev => ev.id === formData.eventId)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Record Points</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Log attendance or event results to award credits.</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button 
            className={`btn ${formData.type === 'ATTENDANCE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFormData({...formData, type: 'ATTENDANCE', message: {text: '', type: ''}} as any)}
          >
            Record Attendance
          </button>
          <button 
            className={`btn ${formData.type === 'RESULT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFormData({...formData, type: 'RESULT', message: {text: '', type: ''}} as any)}
          >
            Record Event Result
          </button>
        </div>

        {message.text && (
          <div style={{ 
            padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px',
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: message.type === 'error' ? '#EF4444' : '#10B981',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {formData.type === 'ATTENDANCE' ? (
            <div className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Student</label>
                <select className="form-input" required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                  <option value="">Select a student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Session ID / Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Morning, Lab 1" required value={formData.sessionId} onChange={e => setFormData({...formData, sessionId: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Select Event</label>
                <select className="form-input" required value={formData.eventId} onChange={e => setFormData({...formData, eventId: e.target.value, studentId: '', teamMemberIds: []})}>
                  <option value="">Select an event...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({ev.type} - {new Date(ev.date).toLocaleDateString()})</option>)}
                </select>
              </div>

              {selectedEvent && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Position</label>
                      <select className="form-input" required value={formData.position} onChange={e => handlePositionChange(e.target.value)}>
                        <option value="1">1st Place</option>
                        <option value="2">2nd Place</option>
                        <option value="3">3rd Place</option>
                        <option value="null">Participation Only</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Points Awarded</label>
                      <input type="number" className="form-input" disabled value={formData.pointsAwarded} />
                    </div>
                  </div>

                  {selectedEvent.type === 'SOLO' ? (
                    <div className="form-group animate-fade-in">
                      <label className="form-label">Select Student</label>
                      <select className="form-input" required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                        <option value="">Select a student...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <div className="form-group">
                        <label className="form-label">Team Name (Optional)</label>
                        <input type="text" className="form-input" placeholder="e.g. Code Ninjas" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Select Team Members</label>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                          {students.map(s => (
                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '4px' }} className="hover:bg-white/5">
                              <input 
                                type="checkbox" 
                                checked={formData.teamMemberIds.includes(s.id)}
                                onChange={() => handleTeamMemberToggle(s.id)}
                              />
                              {s.name} ({s.rollNo}) - {s.branch}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Recording...' : 'Record to Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
