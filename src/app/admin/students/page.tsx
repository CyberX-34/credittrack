'use client'

import { useState, useEffect } from 'react'
import { Plus, Download } from 'lucide-react'

export default function ManageStudents() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', rollNo: '', branch: '', year: '', username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchStudents = () => {
    fetch('/api/admin/students')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStudents(data)
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
                <th>Total Credits</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No students found.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td>{student.rollNo}</td>
                    <td>{student.branch}</td>
                    <td>{student.year}</td>
                    <td>{student.user?.username}</td>
                    <td>
                      <span className="badge badge-gold">{student.totalCredits}</span>
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
