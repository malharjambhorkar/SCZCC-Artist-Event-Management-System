import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage  from './pages/LandingPage'
import LoginPage    from './pages/LoginPage'
import ArtistPortal from './pages/ArtistPortal'
import ClerkPortal  from './pages/ClerkPortal'
import AdminPortal  from './pages/AdminPortal'

function Protected({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin"/></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      <Route path="/artist" element={<Protected roles={['artist']}><ArtistPortal /></Protected>} />
      <Route path="/clerk"  element={<Protected roles={['clerk']}><ClerkPortal /></Protected>} />
      <Route path="/admin"  element={<Protected roles={['admin']}><AdminPortal /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ style:{ background:'#fff', color:'#1c1612', borderRadius:'12px', fontFamily:"'Source Sans 3',sans-serif", fontSize:'14px' }, success:{ iconTheme:{ primary:'#ea580c', secondary:'#fff' } } }} />
      </AuthProvider>
    </BrowserRouter>
  )
}
