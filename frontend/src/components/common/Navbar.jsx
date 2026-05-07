import { LogOut, Palette, Users, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const ROLES = {
  artist: { label: 'Artist Portal', icon: Palette, color: 'text-brand-600' },
  clerk: { label: 'Clerk Portal', icon: Users, color: 'text-brand-500' },
  admin: { label: 'Admin Portal', icon: Shield, color: 'text-red-500' },
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const cfg = ROLES[user?.role] || ROLES.artist
  const Icon = cfg.icon

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-brand-200/40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${cfg.color}`} />
          <span className="font-display font-bold text-dark">Cultural Art Zone</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium hidden sm:block">{cfg.label}</span>
          <button onClick={() => { logout(); toast.success('Logged out'); navigate('/') }} className="btn-secondary text-sm py-1.5 px-3">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </header>
  )
}
