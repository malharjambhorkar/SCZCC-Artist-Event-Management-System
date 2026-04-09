import { useEffect } from 'react'
import { X, Trash2, Loader, LogOut, Palette, Users, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// ── Navbar ────────────────────────────────────────────────────
const ROLES = { artist:{label:'Artist Portal',icon:Palette,color:'text-brand-600'}, clerk:{label:'Clerk Portal',icon:Users,color:'text-brand-500'}, admin:{label:'Admin Portal',icon:Shield,color:'text-red-500'} }

export function Navbar() {
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
          <button onClick={()=>{ logout(); toast.success('Logged out'); navigate('/') }} className="btn-secondary text-sm py-1.5 px-3">
            <LogOut className="w-4 h-4"/> Logout
          </button>
        </div>
      </div>
    </header>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth='max-w-lg' }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className={`modal-box ${maxWidth} page-in`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-display text-xl font-bold text-dark">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── ConfirmModal ──────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title='Delete', message='This cannot be undone.', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
          {loading ? <Loader className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} Delete
        </button>
      </div>
    </Modal>
  )
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color='text-brand-600', sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={`text-3xl font-display font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && <div className="p-2 rounded-xl bg-brand-50"><Icon className={`w-6 h-6 ${color}`}/></div>}
      </div>
    </div>
  )
}

// ── IconBtn ───────────────────────────────────────────────────
export function IconBtn({ onClick, children, danger, success, title }) {
  const cls = danger ? 'hover:bg-red-50 text-gray-300 hover:text-red-500' : success ? 'hover:bg-green-50 text-gray-300 hover:text-green-500' : 'hover:bg-brand-50 text-gray-400 hover:text-brand-600'
  return <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-colors ${cls}`}>{children}</button>
}

// ── FormField ─────────────────────────────────────────────────
export function Field({ label, children }) {
  return <div><label className="label">{label}</label>{children}</div>
}
