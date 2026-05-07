import { fmt } from '../portal/constants.js'

export default function ArtistExpenseForm({ form, setForm, onSubmit, onCancel, saving, artists = [], events = [], isNew }) {
  const calcTotal = Number(form.performance_fee || 0) + Number(form.travel_expense || 0) + Number(form.accommodation_expense || 0) + Number(form.other_expenses || 0)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isNew && (
        <>
          <div><label className="label">Artist *</label><select className="input" value={form.artist_id} onChange={e => setForm({ ...form, artist_id: e.target.value })} required><option value="">Select Artist</option>{artists.map(artist => <option key={artist.id} value={artist.id}>{artist.full_name}</option>)}</select></div>
          <div><label className="label">Event (optional)</label><select className="input" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })}><option value="">Select Event</option>{events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></div>
        </>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Performance Fee (Rs)</label><input className="input" type="number" min="0" placeholder="0" value={form.performance_fee || ''} onChange={e => setForm({ ...form, performance_fee: e.target.value })} /></div>
        <div><label className="label">Travel Expense (Rs)</label><input className="input" type="number" min="0" placeholder="0" value={form.travel_expense || ''} onChange={e => setForm({ ...form, travel_expense: e.target.value })} /></div>
        <div><label className="label">Accommodation (Rs)</label><input className="input" type="number" min="0" placeholder="0" value={form.accommodation_expense || ''} onChange={e => setForm({ ...form, accommodation_expense: e.target.value })} /></div>
        <div><label className="label">Other Expenses (Rs)</label><input className="input" type="number" min="0" placeholder="0" value={form.other_expenses || ''} onChange={e => setForm({ ...form, other_expenses: e.target.value })} /></div>
      </div>
      <div className="p-3 bg-brand-50 rounded-xl"><p className="text-sm font-semibold text-brand-700">Total: {fmt(calcTotal)}</p></div>
      <div><label className="label">Remarks</label><textarea className="input resize-none h-16" placeholder="Optional notes..." value={form.remarks || ''} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : isNew ? 'Add Expense' : 'Save Changes'}</button>
      </div>
    </form>
  )
}
