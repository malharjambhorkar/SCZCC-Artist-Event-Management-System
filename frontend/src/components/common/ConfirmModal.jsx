import { Loader, Trash2 } from 'lucide-react'
import Modal from './Modal.jsx'

export default function ConfirmModal({ open, onClose, onConfirm, title = 'Delete', message = 'This cannot be undone.', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
        </button>
      </div>
    </Modal>
  )
}
