import toast from 'react-hot-toast'

export default function EventForm({ form, setForm, onSubmit, onCancel, saving, venues, artForms, eventCategories, includePhotos = false }) {
  const handleEventPhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setForm({ ...form, event_photos: [...(form.event_photos || []), ev.target.result] })
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Event Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">Date *</label><input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
        <div><label className="label">Venue *</label><select className="input" value={form.venue_id} onChange={e => setForm({ ...form, venue_id: e.target.value })} required><option value="">Select Venue</option>{venues.map(venue => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select></div>
        <div><label className="label">Category *</label><select className="input" value={form.category || 'Performing'} onChange={e => setForm({ ...form, category: e.target.value })} required>{eventCategories.map(category => <option key={category}>{category}</option>)}</select></div>
        <div><label className="label">Art Form *</label><select className="input" value={form.art_form} onChange={e => setForm({ ...form, art_form: e.target.value })} required><option value="">Select</option>{artForms.map(artForm => <option key={artForm}>{artForm}</option>)}</select></div>
        <div><label className="label">Max Participants *</label><input className="input" type="number" min="1" value={form.participants_max} onChange={e => setForm({ ...form, participants_max: e.target.value })} required /></div>
        <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['upcoming', 'ongoing', 'completed', 'cancelled'].map(status => <option key={status}>{status}</option>)}</select></div>
        <div className="col-span-2"><label className="label">Description</label><textarea className="input resize-none h-16" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div className="col-span-2"><label className="label">Press / Media Links (one per line)</label><textarea className="input resize-none h-16" placeholder="https://..." value={(form.press_links || []).join('\n')} onChange={e => setForm({ ...form, press_links: e.target.value.split('\n').filter(Boolean) })} /></div>
        {includePhotos && (
          <div className="col-span-2">
            <label className="label">Event Photos</label>
            <input type="file" accept="image/*" className="input py-2 text-sm" onChange={handleEventPhoto} />
            {(form.event_photos || []).length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.event_photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img src={photo} alt={`event-photo-${index}`} className="w-16 h-16 object-cover rounded border border-gray-200" />
                    <button type="button" onClick={() => setForm({ ...form, event_photos: form.event_photos.filter((_, photoIndex) => photoIndex !== index) })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">x</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  )
}
