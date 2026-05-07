export default function VenueForm({ form, setForm, onSubmit, onCancel, saving, states, areaTypes }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Venue Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">State *</label><select className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} required><option value="">Select</option>{states.map(state => <option key={state}>{state}</option>)}</select></div>
        <div><label className="label">City *</label><input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required /></div>
        <div><label className="label">Area Type</label><select className="input" value={form.area_type} onChange={e => setForm({ ...form, area_type: e.target.value })}>{areaTypes.map(areaType => <option key={areaType}>{areaType}</option>)}</select></div>
        <div><label className="label">Capacity *</label><input className="input" type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} required /></div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  )
}
