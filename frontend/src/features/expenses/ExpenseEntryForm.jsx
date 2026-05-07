export default function ExpenseEntryForm({ form, setForm, onSubmit, onCancel, saving }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Month *</label><select className="input" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>{['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(month => <option key={month}>{month}</option>)}</select></div>
        <div><label className="label">Year *</label><input className="input" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required /></div>
        <div><label className="label">Total Amount *</label><input className="input" type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
        <div><label className="label">Venue (Rs)</label><input className="input" type="number" placeholder="0" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></div>
        <div><label className="label">Equipment (Rs)</label><input className="input" type="number" placeholder="0" value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })} /></div>
        <div><label className="label">Travel (Rs)</label><input className="input" type="number" placeholder="0" value={form.travel} onChange={e => setForm({ ...form, travel: e.target.value })} /></div>
        <div><label className="label">Marketing (Rs)</label><input className="input" type="number" placeholder="0" value={form.marketing} onChange={e => setForm({ ...form, marketing: e.target.value })} /></div>
        <div><label className="label">Miscellaneous (Rs)</label><input className="input" type="number" placeholder="0" value={form.miscellaneous} onChange={e => setForm({ ...form, miscellaneous: e.target.value })} /></div>
        <div className="col-span-2"><label className="label">Remarks</label><textarea className="input resize-none h-16" placeholder="Optional notes..." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Expense'}</button>
      </div>
    </form>
  )
}
