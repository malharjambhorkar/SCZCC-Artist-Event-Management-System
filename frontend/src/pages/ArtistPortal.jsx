import { useState, useEffect } from 'react'
import { User, Palette, Award, Calendar, Save, Loader, Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '../components/common/index.jsx'
import { useAuth } from '../context/AuthContext'
import { artistAPI, eventAPI } from '../utils/api'

const ART_FORMS = ['Traditional Dance','Classical Music','Pottery','Folk Painting','Traditional Theatre','Weaving','Wood Carving','Sculpture','Embroidery','Puppetry','Folk Music']
const LOCATIONS = ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Jaipur','Lucknow','Hyderabad','Pune','Ahmedabad','Bhopal']
const STATES    = ['Maharashtra','Delhi','Karnataka','Tamil Nadu','West Bengal','Rajasthan','Uttar Pradesh','Telangana','Gujarat','Punjab','Madhya Pradesh']
const EDU_QUALS = ['10th','12th','Diploma','Undergraduate (Bachelor\'s Degree)','Postgraduate (Master\'s Degree)','Doctorate (PhD)','None','Other']
const ART_QUALS = ['Self-taught','Formal Training (Institute)','Guru/Shishya Training','Certified Course','Workshop / Short-term Training','Other']
const CASTES    = ['General (Open)','OBC (Other Backward Classes)','SC (Scheduled Castes)','ST (Scheduled Tribes)','Other']

function OtherSelect({ label, options, value, otherValue, onChange, onOtherChange, required }) {
  return (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <select className="input" value={value||''} onChange={e => onChange(e.target.value)} required={required}>
        <option value="">Select</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      {value === 'Other' && (
        <input className="input mt-2" placeholder="Please specify..." value={otherValue||''} onChange={e => onOtherChange(e.target.value)} required/>
      )}
    </div>
  )
}

function printArtistPDF(a) {
  const aadhaarMasked = a.aadhaar_number ? `XXXX-XXXX-${a.aadhaar_number.slice(-4)}` : '—'
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#222;font-size:13px}
  h1{color:#ea580c;font-size:22px;margin:0 0 4px}
  .subtitle{color:#777;font-size:12px;margin-bottom:20px}
  .header{display:flex;align-items:flex-start;gap:20px;border-bottom:2px solid #ea580c;padding-bottom:16px;margin-bottom:16px}
  .photo{width:90px;height:110px;object-fit:cover;border:1px solid #ddd;border-radius:4px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:32px;color:#ea580c}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin-bottom:12px}
  .field{padding:5px 0;border-bottom:1px solid #f0f0f0}
  .field-label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px}
  .field-value{font-size:13px;font-weight:600;margin-top:2px}
  .section-title{background:#ea580c;color:#fff;padding:4px 10px;font-size:11px;font-weight:bold;letter-spacing:1px;margin:14px 0 8px;text-transform:uppercase}
  .badge{display:inline-block;background:#dcfce7;color:#166534;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600}
  .footer{margin-top:30px;border-top:1px solid #eee;padding-top:10px;font-size:10px;color:#aaa;text-align:center}
  @media print{body{margin:0}}
</style></head>
<body>
<div class="header">
  ${a.profile_photo ? `<img class="photo" src="${a.profile_photo}" alt="Photo"/>` : `<div class="photo">${a.full_name?.[0]||'?'}</div>`}
  <div style="flex:1">
    <h1>${a.full_name}</h1>
    <div class="subtitle">${a.art_form}${a.art_form_other ? ` — ${a.art_form_other}` : ''}</div>
    <span class="badge">ACTIVE</span>
    <p style="font-size:11px;color:#555;margin-top:8px">Registration Proof — Cultural Art Zone</p>
    <p style="font-size:10px;color:#aaa;margin:2px 0">Generated on ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</p>
  </div>
</div>
<div class="section-title">Personal Information</div>
<div class="info-grid">
  <div class="field"><div class="field-label">Email</div><div class="field-value">${a.email||'—'}</div></div>
  <div class="field"><div class="field-label">Phone</div><div class="field-value">${a.phone||'—'}</div></div>
  <div class="field"><div class="field-label">Location</div><div class="field-value">${a.location||'—'}</div></div>
  <div class="field"><div class="field-label">State</div><div class="field-value">${a.state||'—'}</div></div>
  <div class="field"><div class="field-label">Caste Category</div><div class="field-value">${a.caste||'—'}${a.caste_other ? ` (${a.caste_other})` : ''}</div></div>
  <div class="field"><div class="field-label">Aadhaar</div><div class="field-value">${aadhaarMasked}</div></div>
</div>
<div class="section-title">Artistic Profile</div>
<div class="info-grid">
  <div class="field"><div class="field-label">Art Form</div><div class="field-value">${a.art_form||'—'}${a.art_form_other ? ` — ${a.art_form_other}` : ''}</div></div>
  <div class="field"><div class="field-label">Experience</div><div class="field-value">${a.years_of_experience||0} years</div></div>
  <div class="field"><div class="field-label">Artistic Qualification</div><div class="field-value">${a.artistic_qualification||'—'}${a.artistic_qualification_other ? ` (${a.artistic_qualification_other})` : ''}</div></div>
  <div class="field"><div class="field-label">Educational Qualification</div><div class="field-value">${a.educational_qualification||'—'}${a.educational_qualification_other ? ` (${a.educational_qualification_other})` : ''}</div></div>
</div>
${a.biography ? `<div class="section-title">Biography</div><p style="font-size:12px;line-height:1.6;color:#444">${a.biography}</p>` : ''}
<div class="footer">This document is a system-generated registration proof from the Cultural Art Zone platform. For verification contact admin@culturalzone.com</div>
</body></html>`

  const w = window.open('','_blank','width=800,height=900')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 500)
}

export default function ArtistPortal() {
  const { user, profile, setProfile } = useAuth()
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({
    full_name:'', email:'', phone:'', art_form:'', art_form_other:'', location:'', state:'',
    years_of_experience:'', biography:'',
    educational_qualification:'', educational_qualification_other:'',
    artistic_qualification:'', artistic_qualification_other:'',
    caste:'', caste_other:'', aadhaar_number:'', profile_photo:''
  })
  const [events, setEvents] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name||'', email: profile.email||'', phone: profile.phone||'',
        art_form: profile.art_form||'', art_form_other: profile.art_form_other||'',
        location: profile.location||'', state: profile.state||'',
        years_of_experience: profile.years_of_experience||'', biography: profile.biography||'',
        educational_qualification: profile.educational_qualification||'',
        educational_qualification_other: profile.educational_qualification_other||'',
        artistic_qualification: profile.artistic_qualification||'',
        artistic_qualification_other: profile.artistic_qualification_other||'',
        caste: profile.caste||'', caste_other: profile.caste_other||'',
        aadhaar_number: profile.aadhaar_number||'',
        profile_photo: profile.profile_photo||''
      })
    }
  }, [profile])

  useEffect(() => {
    if (tab === 'events' && profile?.id) {
      setLoadingEvents(true)
      eventAPI.forArtist(profile.id)
        .then(r => setEvents(r.data.data))
        .catch(() => toast.error('Failed to load events'))
        .finally(() => setLoadingEvents(false))
    }
  }, [tab, profile?.id])

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const r = await artistAPI.update(profile.id, form)
      setProfile(r.data.data)
      toast.success('Profile updated!')
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setSaving(false) }
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({...f, profile_photo: ev.target.result}))
    reader.readAsDataURL(file)
  }

  const F = (k) => ({ value: form[k]||'', onChange: e => setForm({...form,[k]:e.target.value}) })

  return (
    <div className="min-h-screen bg-cream">
      <Navbar/>
      <main className="max-w-5xl mx-auto px-6 py-10 page-in">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-dark">Welcome, {profile?.full_name || user?.name}</h1>
            <p className="text-gray-500 mt-1">Manage your profile and explore events</p>
          </div>
          {profile && (
            <button onClick={()=>printArtistPDF({...profile,...form})} className="btn-secondary flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4"/> Download Registration PDF
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[[User,'Profile','Your status','Active'],
            [Palette,'Art Form','Your specialization',profile?.art_form||'—'],
            [Award,'Experience','Years of practice',profile?.years_of_experience ? `${profile.years_of_experience} years` : '—'],
          ].map(([Icon,label,sub,val],i)=>(
            <div key={i} className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-brand-50 rounded-xl"><Icon className="w-5 h-5 text-brand-600"/></div>
                <div><p className="text-sm text-gray-500">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
              </div>
              <p className="font-display font-bold text-xl text-dark">{val}</p>
            </div>
          ))}
        </div>
        <div className="card overflow-hidden">
          <div className="flex bg-gray-50 border-b border-gray-100 p-1.5 gap-1">
            {[['profile','Profile',User],['events','Events',Calendar]].map(([id,label,Icon])=>(
              <button key={id} onClick={()=>setTab(id)} className={`tab-btn flex-1 justify-center ${tab===id?'tab-active':'tab-inactive'}`}>
                <Icon className="w-4 h-4"/>{label}
              </button>
            ))}
          </div>
          <div className="p-8">
            {tab==='profile' && (
              <form onSubmit={handleSave}>
                <h2 className="font-display text-2xl font-bold text-dark mb-1">Edit Your Profile</h2>
                <p className="text-sm text-gray-500 mb-7">Update your personal and artistic details</p>

                {/* Basic Info */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Basic Information</p>
                <div className="grid md:grid-cols-2 gap-5 mb-6">
                  <div><label className="label">Full Name *</label><input className="input" {...F('full_name')} required/></div>
                  <div><label className="label">Email *</label><input className="input" type="email" {...F('email')} required/></div>
                  <div><label className="label">Phone *</label><input className="input" {...F('phone')} required/></div>
                  <div><label className="label">Aadhaar Number</label><input className="input" placeholder="12-digit number" maxLength={12} {...F('aadhaar_number')}/></div>
                  <div><label className="label">Location *</label>
                    <select className="input" {...F('location')} required>
                      <option value="">Select</option>{LOCATIONS.map(l=><option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div><label className="label">State *</label>
                    <select className="input" {...F('state')} required>
                      <option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Years of Experience</label><input className="input" type="number" min="0" max="60" {...F('years_of_experience')}/></div>
                </div>

                {/* Artistic Details */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Artistic Details</p>
                <div className="grid md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="label">Art Form *</label>
                    <select className="input" value={form.art_form} onChange={e=>setForm({...form,art_form:e.target.value,art_form_other:''})} required>
                      <option value="">Select</option>
                      {ART_FORMS.map(a=><option key={a}>{a}</option>)}
                      <option value="Other">Other</option>
                    </select>
                    {form.art_form==='Other' && <input className="input mt-2" placeholder="Please specify your art form..." value={form.art_form_other||''} onChange={e=>setForm({...form,art_form_other:e.target.value})} required/>}
                  </div>
                  <OtherSelect label="Artistic Qualification" options={ART_QUALS}
                    value={form.artistic_qualification} otherValue={form.artistic_qualification_other}
                    onChange={v=>setForm({...form,artistic_qualification:v,artistic_qualification_other:''})}
                    onOtherChange={v=>setForm({...form,artistic_qualification_other:v})}/>
                </div>

                {/* Academic & Category */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Academic & Category</p>
                <div className="grid md:grid-cols-2 gap-5 mb-6">
                  <OtherSelect label="Educational Qualification" options={EDU_QUALS}
                    value={form.educational_qualification} otherValue={form.educational_qualification_other}
                    onChange={v=>setForm({...form,educational_qualification:v,educational_qualification_other:''})}
                    onOtherChange={v=>setForm({...form,educational_qualification_other:v})}/>
                  <OtherSelect label="Caste Category" options={CASTES}
                    value={form.caste} otherValue={form.caste_other}
                    onChange={v=>setForm({...form,caste:v,caste_other:''})}
                    onOtherChange={v=>setForm({...form,caste_other:v})}/>
                </div>

                {/* Photo & Bio */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Photo & Biography</p>
                <div className="mb-5">
                  <label className="label">Profile Photo (Passport Size)</label>
                  <div className="flex items-start gap-4">
                    {form.profile_photo
                      ? <img src={form.profile_photo} alt="Profile" className="w-20 h-24 object-cover rounded-xl border border-gray-200 flex-shrink-0"/>
                      : <div className="w-20 h-24 rounded-xl bg-brand-50 border-2 border-dashed border-brand-200 flex items-center justify-center flex-shrink-0"><span className="text-3xl text-brand-300">{form.full_name?.[0]||'?'}</span></div>
                    }
                    <div className="flex-1">
                      <input type="file" accept="image/*" className="input py-2 text-sm" onChange={handlePhoto}/>
                      <p className="text-xs text-gray-400 mt-1">Upload a passport-size photo. Max 2MB. JPG or PNG recommended.</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6"><label className="label">Biography</label><textarea className="input resize-none h-28" {...F('biography')}/></div>

                <button type="submit" disabled={saving} className="btn-primary">
                  {saving?<Loader className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>} Save Changes
                </button>
              </form>
            )}
            {tab==='events' && (
              <div>
                <h2 className="font-display text-2xl font-bold text-dark mb-6">My Events</h2>
                {loadingEvents ? <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-brand-500"/></div>
                : events.length===0 ? <div className="text-center py-16 text-gray-400"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>No events assigned yet</p></div>
                : events.map(ev=>(
                  <div key={ev.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3">
                    <div>
                      <p className="font-semibold text-dark">{ev.name}</p>
                      <p className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString('en-IN')} · {ev.venue_name} · {ev.art_form}</p>
                      {ev.category && <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded mt-1 inline-block">{ev.category}</span>}
                    </div>
                    <span className={ev.status==='upcoming'?'badge-active':'badge-inactive'}>{ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
