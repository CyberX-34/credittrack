'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Search, Filter } from 'lucide-react'

export default function Leaderboard() {
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterYear, setFilterYear] = useState('')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStudents(data)
          setFilteredStudents(data)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let result = students
    if (searchTerm) {
      result = result.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.branch.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (filterYear) {
      result = result.filter(s => s.year.toString() === filterYear)
    }
    setFilteredStudents(result)
  }, [searchTerm, filterYear, students])

  if (loading) return <div>Loading leaderboard...</div>

  // Original indices for rank calculation based on the global unsorted/unfiltered list
  const getRank = (id: string) => students.findIndex(s => s.id === id) + 1

  return (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Trophy size={40} color="var(--accent-blue)" /> Hall of Fame
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Global student ranking by total credits earned</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by name or branch..." 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative', width: '150px' }}>
          <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }}
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredStudents.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No students found matching your filters.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const rank = getRank(student.id)
            const isTop3 = rank <= 3
            
            let bgGradient = 'var(--bg-surface-glass)'
            let borderStyle = '1px solid var(--border-color)'
            
            if (rank === 1) {
              bgGradient = 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(21, 26, 34, 0.7) 50%)'
              borderStyle = '1px solid rgba(245, 158, 11, 0.3)'
            } else if (rank === 2) {
              bgGradient = 'linear-gradient(90deg, rgba(148, 163, 184, 0.1) 0%, rgba(21, 26, 34, 0.7) 50%)'
              borderStyle = '1px solid rgba(148, 163, 184, 0.3)'
            } else if (rank === 3) {
              bgGradient = 'linear-gradient(90deg, rgba(180, 83, 9, 0.1) 0%, rgba(21, 26, 34, 0.7) 50%)'
              borderStyle = '1px solid rgba(180, 83, 9, 0.3)'
            }

            return (
              <div key={student.id} className="glass-card animate-fade-in" style={{ 
                padding: '1.5rem 2rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '2rem',
                background: bgGradient,
                border: borderStyle,
                transform: rank === 1 ? 'scale(1.02)' : 'scale(1)',
                zIndex: isTop3 ? 10 : 1,
                boxShadow: rank === 1 ? '0 10px 40px rgba(245, 158, 11, 0.15)' : 'var(--shadow-card)'
              }}>
                <div style={{ width: '50px', display: 'flex', justifyContent: 'center' }}>
                  {rank === 1 ? <Medal size={40} color="#FBBF24" /> :
                   rank === 2 ? <Medal size={34} color="#CBD5E1" /> :
                   rank === 3 ? <Medal size={30} color="#D97706" /> :
                   <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)' }}>#{rank}</span>}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', 
                    background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-secondary)'
                  }}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: isTop3 ? '#fff' : 'var(--text-primary)' }}>{student.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{student.branch} • Year {student.year}</p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Credits</p>
                  <h2 style={{ fontSize: '2rem', color: rank === 1 ? '#FBBF24' : rank === 2 ? '#CBD5E1' : rank === 3 ? '#D97706' : 'var(--accent-blue)', lineHeight: 1 }}>
                    {student.totalCredits}
                  </h2>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
