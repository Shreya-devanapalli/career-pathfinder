import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cp_token'))
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(false)

  const fetchMe = useCallback(async () => {
    const { data } = await client.get('/api/auth/me')
    setUser(data)
    return data
  }, [])

  const signup = useCallback(
    async (email, password, fullName) => {
      const { data } = await client.post('/api/auth/signup', {
        email,
        password,
        full_name: fullName || null,
      })
      localStorage.setItem('cp_token', data.access_token)
      setToken(data.access_token)
      await fetchMe()
    },
    [fetchMe],
  )

  const login = useCallback(
    async (email, password) => {
      const { data } = await client.post('/api/auth/login', { email, password })
      localStorage.setItem('cp_token', data.access_token)
      setToken(data.access_token)
      await fetchMe()
    },
    [fetchMe],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('cp_token')
    setToken(null)
    setUser(null)
  }, [])

  // On first load, if a token is already in localStorage, hydrate the user.
  useEffect(() => {
    if (token && !user) {
      setLoadingUser(true)
      fetchMe()
        .catch(() => logout())
        .finally(() => setLoadingUser(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, loadingUser, signup, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
