'use client'

import { useState, useEffect } from 'react'
import { Plus, Download } from 'lucide-react'

export default function ManageStudents() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING' | 'CORRECTIONS'>('ACTIVE')
  const [students, setStudents] = useState<any[]>([])
  const [pendingStudents, setPendingStudents] = useState<any[]>([])
  const [corrections, setCorrections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', rollNo: '', branch: '', year: '', username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchStudents = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/students?status=APPROVED').then(res => res.json()),
      fetch('/api/admin/students?status=PENDING').then(res => res.json()),
      fetch('/api/admin/profile-corrections').then(res => res.json())
    ]).then(([activeData, pendingData, correctionsData]) => {
      if (!activeData.error) setStudents(activeData)
      if (!pendingData.error) setPendingStudents(pendingData)
      if (!correctionsData.error) setCorrections(correctionsData)
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
      const student = pendingStudents.find(s => s.id === studentId)
      const res = await fetch('/api/admin/students/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, 
          action,
          name: student?.name,
          rollNo: student?.rollNo,
          branch: student?.branch,
          year: student?.year
        })
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

  const handleApproveRejectCorrection = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const req = corrections.find(r => r.id === requestId)
      const res = await fetch('/api/admin/profile-corrections/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          action,
          name: req?.proposedName,
          rollNo: req?.proposedRollNo,
          branch: req?.proposedBranch,
          year: req?.proposedYear
        })
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

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student profile? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchStudents()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete student')
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  const handleResetPassword = async (studentId: string) => {
    const newPassword = prompt('Enter new password for this student:')
    if (!newPassword) return
    try {
      const res = await fetch(`/api/admin/students/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newPassword })
      })
      if (res.ok) {
        alert('Password reset successfully')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to reset password')
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  const handleUpdateActive = async (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.name,
          rollNo: student.rollNo,
          branch: student.branch,
          year: student.year
        })
      })
      if (res.ok) {
        alert('Student updated successfully')
        fetchStudents()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update student')
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Students</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage student profiles and accounts.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
        <button 
          onClick={() => setActiveTab('CORRECTIONS')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
            color: activeTab === 'CORRECTIONS' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'CORRECTIONS' ? '2px solid var(--primary)' : '2px solid transparent',
            fontWeight: activeTab === 'CORRECTIONS' ? 600 : 400,
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          Profile Corrections
          {corrections.length > 0 && (
            <span style={{ background: '#EAB308', color: '#000', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
              {corrections.length}
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
                {activeTab !== 'CORRECTIONS' && <th>Username</th>}
                {activeTab === 'ACTIVE' ? (
                  <>
                    <th>Total Credits</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </>
                ) : (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : activeTab === 'CORRECTIONS' ? (
              corrections.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No pending profile corrections.</td></tr>
              ) : (
                corrections.map((req: any) => (
                  <tr key={req.id}>
                    <td>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Original: {req.student.name}</div>
                        <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '120px', border: '1px solid #EAB308' }} value={req.proposedName} onChange={e => setCorrections(prev => prev.map(r => r.id === req.id ? { ...r, proposedName: e.target.value } : r))} />
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Original: {req.student.rollNo}</div>
                        <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '100px', border: '1px solid #EAB308' }} value={req.proposedRollNo} onChange={e => setCorrections(prev => prev.map(r => r.id === req.id ? { ...r, proposedRollNo: e.target.value } : r))} />
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Original: {req.student.branch}</div>
                        <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '100px', border: '1px solid #EAB308' }} value={req.proposedBranch} onChange={e => setCorrections(prev => prev.map(r => r.id === req.id ? { ...r, proposedBranch: e.target.value } : r))} />
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Original: {req.student.year}</div>
                        <input type="number" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '70px', border: '1px solid #EAB308' }} value={req.proposedYear} onChange={e => setCorrections(prev => prev.map(r => r.id === req.id ? { ...r, proposedYear: e.target.value } : r))} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleApproveRejectCorrection(req.id, 'approve')} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                          Approve
                        </button>
                        <button onClick={() => handleApproveRejectCorrection(req.id, 'reject')} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            ) : (activeTab === 'ACTIVE' ? students : pendingStudents).length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No active students found.</td></tr>
              ) : activeTab === 'PENDING' && pendingStudents.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No pending registrations.</td></tr>
              ) : (
                (activeTab === 'ACTIVE' ? students : pendingStudents).map((student) => (
                  <tr key={student.id}>
                    {activeTab === 'ACTIVE' ? (
                      <>
                        <td>
                          <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '120px' }} value={student.name} onChange={e => setStudents(prev => prev.map(s => s.id === student.id ? { ...s, name: e.target.value } : s))} />
                        </td>
                        <td>
                          <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '100px' }} value={student.rollNo} onChange={e => setStudents(prev => prev.map(s => s.id === student.id ? { ...s, rollNo: e.target.value } : s))} />
                        </td>
                        <td>
                          <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '100px' }} value={student.branch} onChange={e => setStudents(prev => prev.map(s => s.id === student.id ? { ...s, branch: e.target.value } : s))} />
                        </td>
                        <td>
                          <input type="number" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '70px' }} value={student.year} onChange={e => setStudents(prev => prev.map(s => s.id === student.id ? { ...s, year: e.target.value } : s))} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '120px' }} value={student.name} onChange={e => setPendingStudents(prev => prev.map(s => s.id === student.id ? { ...s, name: e.target.value } : s))} />
                        </td>
                        <td>
                          <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '100px' }} value={student.rollNo} onChange={e => setPendingStudents(prev => prev.map(s => s.id === student.id ? { ...s, rollNo: e.target.value } : s))} />
                        </td>
                        <td>
                          <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '100px' }} value={student.branch} onChange={e => setPendingStudents(prev => prev.map(s => s.id === student.id ? { ...s, branch: e.target.value } : s))} />
                        </td>
                        <td>
                          <input type="number" className="form-input" style={{ padding: '0.25rem 0.5rem', width: '100%', minWidth: '70px' }} value={student.year} onChange={e => setPendingStudents(prev => prev.map(s => s.id === student.id ? { ...s, year: e.target.value } : s))} />
                        </td>
                      </>
                    )}
                    <td>{student.user?.username || 'Google User'}</td>
                    {activeTab === 'ACTIVE' ? (
                      <>
                        <td>
                          <span className="badge badge-gold">{student.totalCredits}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleUpdateActive(student.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                              Save
                            </button>
                            <button onClick={() => handleResetPassword(student.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} disabled={student.user?.authProvider === 'GOOGLE'}>
                              Reset Password
                            </button>
                            <button onClick={() => handleDeleteStudent(student.id)} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
