import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Palette, Users, Shield, Eye, EyeOff, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { id:'artist', label:'Artist',  desc:'Manage your profile and artistic details', icon:Palette, color:'text-brand-600' },
  { id:'clerk',  label:'Clerk',   desc:'View and manage all artist details',        icon:Users,   color:'text-brand-500' },
  { id:'admin',  label:'Admin',   desc:'Complete system access and control',        icon:Shield,  color:'text-red-500' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [role, setRole]     = useState('artist')
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, pw, role)
      toast.success(`Welcome back!`)
      navigate(`/${user.role}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12 page-in">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-brand-600">Cultural Art Zone</h1>
        <p className="text-gray-500 mt-2">Preserving Heritage Through Digital Innovation</p>
      </div>
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-dark mb-1">Select Your Role</h2>
          <p className="text-sm text-gray-500 mb-6">Choose how you'll access the system</p>
          <div className="flex flex-col gap-3">
            {ROLES.map(r => {
              const Icon = r.icon; const active = role === r.id
              return (
                <button key={r.id} onClick={()=>setRole(r.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${active?'border-brand-400 bg-brand-50':'border-gray-200 bg-gray-50 hover:border-brand-200'}`}>
                  <div className={`p-2 rounded-lg ${active?'bg-white shadow-sm':'bg-white/60'}`}><Icon className={`w-5 h-5 ${r.color}`}/></div>
                  <div><div className="font-semibold text-dark text-sm">{r.label}</div><div className="text-xs text-gray-500">{r.desc}</div></div>
                </button>
              )
            })}
          </div>
        </div>
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-dark mb-1">Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)} required/>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw?'text':'password'} className="input pr-10" placeholder="Enter your password" value={pw} onChange={e=>setPw(e.target.value)} required/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading&&<Loader className="w-4 h-4 animate-spin"/>} Sign In as {ROLES.find(r=>r.id===role)?.label}
            </button>
          </form>
          <div className="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-100">
            <p className="text-xs font-bold text-brand-700 mb-2">Demo Credentials</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><b>Admin:</b> admin@culturalzone.com / admin123</p>
              <p><b>Clerk:</b> clerk@culturalzone.com / clerk123</p>
              <p><b>Artist:</b> john@example.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
