'use client'

import { useState, useEffect } from 'react'

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', rollNo: '', branch: '', year: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

  useEffect(() => {
    fetch('/api/student/profile')
      .then(res => res.json())
      .then(data => {
        if (data.studentProfile) {
          setProfile(data.studentProfile)
          
          if (data.studentProfile.correctionRequests && data.studentProfile.correctionRequests.length > 0) {
            setHasPendingRequest(true)
            const pending = data.studentProfile.correctionRequests[0]
            setFormData({
              name: pending.proposedName,
              rollNo: pending.proposedRollNo,
              branch: pending.proposedBranch,
              year: pending.proposedYear.toString()
            })
          } else {
            setFormData({
              name: data.studentProfile.name,
              rollNo: data.studentProfile.rollNo,
              branch: data.studentProfile.branch,
              year: data.studentProfile.year.toString()
            })
          }
        }
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    
    try {
      const res = await fetch('/api/student/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit correction request')
      } else {
        setMessage('Correction request submitted successfully! Awaiting admin approval.')
        setHasPendingRequest(true)
      }
    } catch (err) {
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>My Profile</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Update your personal details here.</p>

      <div className="glass-card" style={{ padding: '2rem' }}>
        {hasPendingRequest && (
          <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', color: '#EAB308', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <strong>Pending Approval:</strong> Your profile correction request has been submitted and is awaiting admin approval. The fields below reflect your proposed changes.
          </div>
        )}
        
        {message && !hasPendingRequest && (
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              disabled={hasPendingRequest}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Roll Number</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.rollNo} 
              onChange={e => setFormData({ ...formData, rollNo: e.target.value })} 
              disabled={hasPendingRequest}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Branch</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.branch} 
              onChange={e => setFormData({ ...formData, branch: e.target.value })} 
              disabled={hasPendingRequest}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Year (1-4)</label>
            <input 
              type="number" 
              className="form-input" 
              required 
              min="1"
              max="4"
              value={formData.year} 
              onChange={e => setFormData({ ...formData, year: e.target.value })} 
              disabled={hasPendingRequest}
            />
          </div>

          {!hasPendingRequest && (
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
              disabled={saving}
            >
              {saving ? 'Submitting...' : 'Request Correction'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
