'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

export default function ManageAdmins() {
  const [admins, setAdmins] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchAdmins = () => {
    fetch('/api/admin/admins')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setAdmins(data.admins || [])
          setCurrentUser(data.currentUser || null)
        }
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        setShowModal(false)
        setFormData({ name: '', username: '', password: '' })
        fetchAdmins()
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin account? This action will disable their login.')) return
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAdmins()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete admin')
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  const handleResetPassword = async (adminId: string) => {
    const newPassword = prompt('Enter new password for this admin (min 8 characters):')
    if (!newPassword) return
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
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

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Admins</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage administrative access.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            Add Admin
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Created At</th>
                {currentUser?.isSuperAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={currentUser?.isSuperAdmin ? 4 : 3} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={currentUser?.isSuperAdmin ? 4 : 3} style={{ textAlign: 'center', padding: '2rem' }}>No admins found.</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id}>
                    <td style={{ fontWeight: 500 }}>
                      {admin.name}
                      {admin.isSuperAdmin && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'rgba(234, 179, 8, 0.2)', color: '#EAB308', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Superadmin</span>
                      )}
                    </td>
                    <td>{admin.user?.username}</td>
                    <td>{new Date(admin.user?.createdAt).toLocaleDateString()}</td>
                    {currentUser?.isSuperAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {currentUser.id !== admin.id && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleResetPassword(admin.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                              Reset Password
                            </button>
                            <button onClick={() => handleDelete(admin.id)} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                              Delete
                            </button>
                          </div>
                        )}
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
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Admin</h2>
            {error && <div style={{ color: '#EF4444', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Username</label>
                  <input type="text" className="form-input" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Password</label>
                  <input type="text" className="form-input" required minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
