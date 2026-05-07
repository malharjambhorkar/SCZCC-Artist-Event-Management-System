import toast from 'react-hot-toast'
import OtherSelect from './OtherSelect.jsx'
import { ART_FORMS, LOCATIONS, STATES, EDU_QUALS, ART_QUALS, CASTES } from '../portal/constants.js'

export default function ArtistForm({ f, setF, onSubmit, saving, onCancel, isNew }) {
  const bindField = (key) => ({
    value: f[key] || '',
    onChange: e => setF({ ...f, [key]: e.target.value }),
  })

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setF({ ...f, profile_photo: ev.target.result })
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Basic Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name *</label><input className="input" {...bindField('full_name')} required /></div>
          <div><label className="label">Email *</label><input className="input" type="email" {...bindField('email')} required /></div>
          <div><label className="label">Phone *</label><input className="input" {...bindField('phone')} required /></div>
          {isNew && <div><label className="label">Password</label><input className="input" type="password" {...bindField('password')} /></div>}
          <div><label className="label">Location *</label><select className="input" {...bindField('location')} required><option value="">Select</option>{LOCATIONS.map(location => <option key={location}>{location}</option>)}</select></div>
          <div><label className="label">State *</label><select className="input" {...bindField('state')} required><option value="">Select</option>{STATES.map(state => <option key={state}>{state}</option>)}</select></div>
          <div><label className="label">Experience (yrs)</label><input className="input" type="number" min="0" {...bindField('years_of_experience')} /></div>
          <div><label className="label">Aadhaar Number</label><input className="input" placeholder="12-digit number" maxLength={12} {...bindField('aadhaar_number')} /></div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Artistic Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <OtherSelect
              label="Art Form"
              options={[...ART_FORMS, 'Other']}
              required
              value={f.art_form || ''}
              otherValue={f.art_form_other}
              onChange={value => setF({ ...f, art_form: value, art_form_other: '' })}
              onOtherChange={value => setF({ ...f, art_form_other: value })}
            />
          </div>
          <OtherSelect
            label="Artistic Qualification"
            options={ART_QUALS}
            value={f.artistic_qualification || ''}
            otherValue={f.artistic_qualification_other}
            onChange={value => setF({ ...f, artistic_qualification: value, artistic_qualification_other: '' })}
            onOtherChange={value => setF({ ...f, artistic_qualification_other: value })}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Academic & Category</p>
        <div className="grid grid-cols-2 gap-4">
          <OtherSelect
            label="Educational Qualification"
            options={EDU_QUALS}
            value={f.educational_qualification || ''}
            otherValue={f.educational_qualification_other}
            onChange={value => setF({ ...f, educational_qualification: value, educational_qualification_other: '' })}
            onOtherChange={value => setF({ ...f, educational_qualification_other: value })}
          />
          <OtherSelect
            label="Caste Category"
            options={CASTES}
            value={f.caste || ''}
            otherValue={f.caste_other}
            onChange={value => setF({ ...f, caste: value, caste_other: '' })}
            onOtherChange={value => setF({ ...f, caste_other: value })}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Photo & Biography</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Profile Photo (Passport Size)</label>
            <input type="file" accept="image/*" className="input py-2 text-sm" onChange={handlePhoto} />
            {f.profile_photo && <img src={f.profile_photo} alt="Preview" className="mt-2 w-20 h-24 object-cover rounded border border-gray-200" />}
          </div>
        </div>
        <div className="mt-3"><label className="label">Biography</label><textarea className="input resize-none h-20" {...bindField('biography')} /></div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : isNew ? 'Add Artist' : 'Save Changes'}</button>
      </div>
    </form>
  )
}
