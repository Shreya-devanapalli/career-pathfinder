import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { btnPrimary, colors, fonts, inputStyle, page } from '../styles/theme'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await signup(email, password, fullName)
      navigate('/assessment')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Signup failed. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form
        onSubmit={handleSubmit}
        style={{ width: 360, maxWidth: '100%', background: colors.panel, border: `1px solid ${colors.line}`, borderRadius: 16, padding: 32 }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 12,
            color: colors.teal,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Career Pathfinder
        </div>
        <h1 style={{ fontFamily: fonts.serif, fontSize: 24, margin: '0 0 20px', color: colors.paper }}>Create your account</h1>

        <input
          style={inputStyle}
          type="text"
          placeholder="Full name (optional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          style={inputStyle}
          type="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div style={{ color: colors.coral, fontSize: 13, marginBottom: 14, fontFamily: fonts.mono }}>{error}</div>
        )}

        <button type="submit" style={{ ...btnPrimary, width: '100%' }} disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <div style={{ marginTop: 16, fontSize: 13, color: colors.muted, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: colors.teal }}>
            Sign in
          </Link>
        </div>
      </form>
    </div>
  )
}
