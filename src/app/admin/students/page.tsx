'use client'

import { useState, useEffect } from 'react'
import { Plus, Download } from 'lucide-react'

export default function ManageStudents() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING'>('ACTIVE')
  const [students, setStudents] = useState<any[]>([])
  const [pendingStudents, setPendingStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', rollNo: '', branch: '', year: '', username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchStudents = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/students?status=APPROVED').then(res => res.json()),
      fetch('/api/admin/students?status=PENDING').then(res => res.json())
    ]).then(([activeData, pendingData]) => {
      if (!activeData.error) setStudents(activeData)
      if (!pendingData.error) setPendingStudents(pendingData)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        setShowModal(false)
        setFormData({ name: '', rollNo: '', branch: '', year: '', username: '', password: '' })
        fetchStudents()
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveReject = async (studentId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/students/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, action })
      })
      if (res.ok) {
        fetchStudents()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to process request')
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Students</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage student profiles and accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/api/admin/export?type=students" className="btn btn-secondary" download>
            <Download size={18} />
            Export CSV
          </a>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <button 
          onClick={() => setActiveTab('ACTIVE')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
            color: activeTab === 'ACTIVE' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'ACTIVE' ? '2px solid var(--primary)' : '2px solid transparent',
            fontWeight: activeTab === 'ACTIVE' ? 600 : 400
          }}
        >
          Active Students
        </button>
        <button 
          onClick={() => setActiveTab('PENDING')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
            color: activeTab === 'PENDING' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'PENDING' ? '2px solid var(--primary)' : '2px solid transparent',
            fontWeight: activeTab === 'PENDING' ? 600 : 400,
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          Pending Approvals
          {pendingStudents.length > 0 && (
            <span style={{ background: '#EF4444', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
              {pendingStudents.length}
            </span>
          )}
        </button>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Username</th>
                {activeTab === 'ACTIVE' ? (
                  <th>Total Credits</th>
                ) : (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : activeTab === 'ACTIVE' && students.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No active students found.</td></tr>
              ) : activeTab === 'PENDING' && pendingStudents.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No pending registrations.</td></tr>
              ) : (
                (activeTab === 'ACTIVE' ? students : pendingStudents).map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td>{student.rollNo}</td>
                    <td>{student.branch}</td>
                    <td>{student.year}</td>
                    <td>{student.user?.username}</td>
                    {activeTab === 'ACTIVE' ? (
                      <td>
                        <span className="badge badge-gold">{student.totalCredits}</span>
                      </td>
                    ) : (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleApproveReject(student.id, 'approve')} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            Approve
                          </button>
                          <button onClick={() => handleApproveReject(student.id, 'reject')} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
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
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Student</h2>
            {error && <div style={{ color: '#EF4444', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input type="text" className="form-input" required value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <input type="text" className="form-input" required value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="number" className="form-input" required min="1" max="4" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Username</label>
                  <input type="text" className="form-input" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Password</label>
                  <input type="text" className="form-input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
