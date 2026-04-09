import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('caz_user')) } catch { return null } })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('caz_token')
    if (token && user) {
      authAPI.me()
        .then(r => { setUser(r.data.data.user); setProfile(r.data.data.profile) })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else setLoading(false)
  }, [])

  const login = async (email, password, role) => {
    const r = await authAPI.login({ email, password, role })
    const { token, user: u, profile: p } = r.data.data
    localStorage.setItem('caz_token', token)
    localStorage.setItem('caz_user', JSON.stringify(u))
    setUser(u); setProfile(p); return u
  }

  const logout = () => {
    localStorage.removeItem('caz_token'); localStorage.removeItem('caz_user')
    setUser(null); setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
