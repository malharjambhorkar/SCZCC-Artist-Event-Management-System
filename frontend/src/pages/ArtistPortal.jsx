import { useState, useEffect } from 'react'
import { User, Palette, Award, Calendar, Save, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '../components/common/index.jsx'
import { useAuth } from '../context/AuthContext'
import { artistAPI, eventAPI } from '../utils/api'

const ART_FORMS = ['Traditional Dance','Classical Music','Pottery','Folk Painting','Traditional Theatre','Weaving','Wood Carving','Sculpture','Embroidery','Puppetry','Folk Music','Other']
const LOCATIONS = ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Jaipur','Lucknow','Hyderabad','Pune','Ahmedabad','Bhopal','Other']
const STATES = ['Maharashtra','Delhi','Karnataka','Tamil Nadu','West Bengal','Rajasthan','Uttar Pradesh','Telangana','Gujarat','Punjab','Madhya Pradesh','Other']

export default function ArtistPortal() {
  const { user, profile, setProfile } = useAuth()
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', art_form:'', location:'', state:'', years_of_experience:'', biography:'' })
  const [events, setEvents] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    if (profile) setForm({ full_name:profile.full_name||'', email:profile.email||'', phone:profile.phone||'', art_form:profile.art_form||'', location:profile.location||'', state:profile.state||'', years_of_experience:profile.years_of_experience||'', biography:profile.biography||'' })
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

  const F = (k) => ({ value: form[k]||'', onChange: e => setForm({...form,[k]:e.target.value}) })

  return (
    <div className="min-h-screen bg-cream">
      <Navbar/>
      <main className="max-w-5xl mx-auto px-6 py-10 page-in">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-dark">Welcome, {profile?.full_name || user?.name}</h1>
          <p className="text-gray-500 mt-1">Manage your profile and explore events</p>
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
                <div className="grid md:grid-cols-2 gap-5">
                  <div><label className="label">Full Name *</label><input className="input" {...F('full_name')} required/></div>
                  <div><label className="label">Email *</label><input className="input" type="email" {...F('email')} required/></div>
                  <div><label className="label">Phone *</label><input className="input" {...F('phone')} required/></div>
                  <div><label className="label">Art Form *</label>
                    <select className="input" {...F('art_form')} required><option value="">Select</option>{ART_FORMS.map(a=><option key={a}>{a}</option>)}</select>
                  </div>
                  <div><label className="label">Location *</label>
                    <select className="input" {...F('location')} required><option value="">Select</option>{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select>
                  </div>
                  <div><label className="label">State *</label>
                    <select className="input" {...F('state')} required><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select>
                  </div>
                  <div><label className="label">Years of Experience</label><input className="input" type="number" min="0" max="60" {...F('years_of_experience')}/></div>
                </div>
                <div className="mt-5"><label className="label">Biography</label><textarea className="input resize-none h-28" {...F('biography')}/></div>
                <button type="submit" disabled={saving} className="btn-primary mt-6">
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
                    <div><p className="font-semibold text-dark">{ev.name}</p><p className="text-sm text-gray-500">{ev.date} · {ev.venue_name} · {ev.art_form}</p></div>
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
