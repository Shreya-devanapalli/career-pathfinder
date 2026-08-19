import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { btnPrimary, colors, fonts, inputStyle, page } from '../styles/theme'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/assessment')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed. Check your email and password.')
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
        <h1 style={{ fontFamily: fonts.serif, fontSize: 24, margin: '0 0 20px', color: colors.paper }}>Welcome back</h1>

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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div style={{ color: colors.coral, fontSize: 13, marginBottom: 14, fontFamily: fonts.mono }}>{error}</div>
        )}

        <button type="submit" style={{ ...btnPrimary, width: '100%' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ marginTop: 16, fontSize: 13, color: colors.muted, textAlign: 'center' }}>
          No account?{' '}
          <Link to="/signup" style={{ color: colors.teal }}>
            Sign up
          </Link>
        </div>
      </form>
    </div>
  )
}
