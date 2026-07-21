'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', rollNo: '', branch: '', year: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
      } else {
        setSuccess(data.message)
        // Reset form
        setFormData({ name: '', rollNo: '', branch: '', year: '', username: '', password: '' })
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg-primary)' }}>
      <div className="glass-card animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CreditTrack
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Student Registration</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="John Doe"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Roll Number</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.rollNo}
              onChange={e => setFormData({...formData, rollNo: e.target.value})}
              placeholder="e.g. 21CS101"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Branch</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.branch}
              onChange={e => setFormData({...formData, branch: e.target.value})}
              placeholder="e.g. CSE"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Year</label>
            <input 
              type="number" 
              className="form-input" 
              required 
              min="1" max="4"
              value={formData.year}
              onChange={e => setFormData({...formData, year: e.target.value})}
              placeholder="e.g. 3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              required 
              minLength={8}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="At least 8 characters"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Register Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
