'use client'

import { useState, useEffect } from 'react'
import { Plus, Download } from 'lucide-react'

export default function ManageEvents() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', date: '', type: 'SOLO', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchEvents = () => {
    fetch('/api/admin/events')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setEvents(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        setShowModal(false)
        setFormData({ name: '', date: '', type: 'SOLO', description: '' })
        fetchEvents()
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Events</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage events and competitions.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <a href="/api/admin/export?type=events" className="btn btn-secondary" download>
            <Download size={18} />
            Export CSV
          </a>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            Create Event
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No events found.</td></tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td style={{ fontWeight: 500 }}>{event.name}</td>
                    <td>{new Date(event.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${event.type === 'SOLO' ? 'badge-blue' : 'badge-gold'}`}>
                        {event.type}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Event</h2>
            {error && <div style={{ color: '#EF4444', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="SOLO">Solo</option>
                    <option value="GROUP">Group</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
