import { useState, useEffect, useCallback, useRef } from 'react'
import { Users, Calendar, MapPin, DollarSign, FileText, Search, Plus, Eye, Edit, Trash2, UserCheck, UserX, Filter, Download, Loader, X, TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import toast from 'react-hot-toast'
import { Navbar, StatCard, Modal, ConfirmModal, IconBtn } from '../components/common/index.jsx'
import { artistAPI, artistExpenseAPI, eventAPI, venueAPI, expenseAPI, reportAPI, downloadBlob } from '../utils/api'

const ART_FORMS = ['Traditional Dance','Classical Music','Pottery','Folk Painting','Traditional Theatre','Weaving','Wood Carving','Sculpture','Embroidery','Puppetry','Folk Music']
const LOCATIONS = ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Jaipur','Lucknow','Hyderabad','Pune','Ahmedabad']
const STATES    = ['Maharashtra','Madhya Pradesh','Karnataka','Chhattisgarh','Andra Pradesh','Telangana','Others']
const AREA_TYPES = ['Urban','Semi-Urban','Rural']
const FY_OPTIONS = ['2024-25','2023-24','2022-23']
const EDU_QUALS = ['10th','12th','Diploma','Undergraduate (Bachelor\'s Degree)','Postgraduate (Master\'s Degree)','Doctorate (PhD)','None','Other']
const ART_QUALS = ['Self-taught','Formal Training (Institute)','Guru/Shishya Training','Certified Course','Workshop / Short-term Training','Other']
const CASTES    = ['General (Open)','OBC (Other Backward Classes)','SC (Scheduled Castes)','ST (Scheduled Tribes)','Other']
const EVENT_CATEGORIES = ['Performing','Workshops']
const fmt = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0)

// ─── "Other" dropdown helper ───────────────────────────────────────────────
function OtherSelect({ label, options, value, otherValue, onChange, onOtherChange, required }) {
  return (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <select className="input" value={value} onChange={e => onChange(e.target.value)} required={required}>
        <option value="">Select</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      {value === 'Other' && (
        <input className="input mt-2" placeholder="Please specify..." value={otherValue||''} onChange={e => onOtherChange(e.target.value)} required/>
      )}
    </div>
  )
}

// ─── Print PDF for artist ─────────────────────────────────────────────────
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
    <span class="badge">${a.status?.toUpperCase() || 'ACTIVE'}</span>
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

export default function AdminPortal() {
  const [tab, setTab] = useState('artists')
  const [dash, setDash] = useState({})

  useEffect(()=>{ reportAPI.dashboard().then(r=>setDash(r.data.data)).catch(()=>{}) },[])

  const TABS = [
    {id:'artists',label:'Artists',icon:Users},
    {id:'events',label:'Events',icon:Calendar},
    {id:'venues',label:'Venues',icon:MapPin},
    {id:'expenses',label:'Expenses',icon:DollarSign},
    {id:'artist-expenses',label:'Artist Expenses',icon:Receipt},
    {id:'reports',label:'Reports',icon:FileText}
  ]

  return (
    <div className="min-h-screen bg-cream">
      <Navbar/>
      <main className="max-w-7xl mx-auto px-6 py-10 page-in">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-dark">System Dashboard</h1>
          <p className="text-gray-500 mt-1">Complete control over the Cultural Art Zone platform</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Artists"      value={dash.totalArtists||0}    icon={Users}    color="text-brand-600"/>
          <StatCard label="Active Events"      value={dash.activeEvents||0}    icon={Calendar} color="text-brand-500"/>
          <StatCard label="Total Venues"       value={dash.totalVenues||0}     icon={MapPin}   color="text-brand-600"/>
          <StatCard label="Events This Month"  value={dash.eventsThisMonth||0} icon={TrendingUp} color="text-brand-500"/>
        </div>
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-display text-xl font-bold text-dark">System Management</h2>
            <p className="text-sm text-gray-500">Manage all aspects of the platform</p>
          </div>
          <div className="flex bg-gray-50 border-b border-gray-100 p-1.5 gap-1 overflow-x-auto">
            {TABS.map(t=>{ const Icon=t.icon; return (
              <button key={t.id} onClick={()=>setTab(t.id)} className={`tab-btn flex-1 justify-center min-w-[100px] ${tab===t.id?'tab-active':'tab-inactive'}`}>
                <Icon className="w-4 h-4"/>{t.label}
              </button>
            )})}
          </div>
          <div className="p-6">
            {tab==='artists'          && <ArtistsTab/>}
            {tab==='events'           && <EventsTab/>}
            {tab==='venues'           && <VenuesTab/>}
            {tab==='expenses'         && <ExpensesTab/>}
            {tab==='artist-expenses'  && <ArtistExpensesTab/>}
            {tab==='reports'          && <ReportsTab/>}
          </div>
        </div>
      </main>
    </div>
  )
}

// ═══════════════ ARTISTS TAB ═══════════════
function ArtistsTab() {
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState(''); const [statusF,setStatusF]=useState(''); const [artFormF,setArtFormF]=useState('')
  const [showAdd,setShowAdd]=useState(false); const [editItem,setEditItem]=useState(null); const [viewItem,setViewItem]=useState(null)
  const [delId,setDelId]=useState(null); const [deleting,setDeleting]=useState(false); const [saving,setSaving]=useState(false)
  const [showF,setShowF]=useState(false)
  const emptyForm = {
    full_name:'',email:'',phone:'',art_form:'',art_form_other:'',location:'',state:'',years_of_experience:'',biography:'',password:'Password@123',
    educational_qualification:'',educational_qualification_other:'',
    artistic_qualification:'',artistic_qualification_other:'',
    caste:'',caste_other:'',aadhaar_number:'',profile_photo:''
  }
  const [form,setForm]=useState(emptyForm)

  const fetch=useCallback(async()=>{
    setLoading(true)
    try{ const p={}; if(search)p.search=search; if(statusF)p.status=statusF; if(artFormF)p.art_form=artFormF
      const r=await artistAPI.list(p); setList(r.data.data) }
    catch{ toast.error('Failed') } finally{ setLoading(false) }
  },[search,statusF,artFormF])

  useEffect(()=>{fetch()},[fetch])

  const handleAdd=async(e)=>{ e.preventDefault(); setSaving(true); try{ await artistAPI.create(form); toast.success('Artist added'); setShowAdd(false); setForm(emptyForm); fetch() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleEdit=async(e)=>{ e.preventDefault(); setSaving(true); try{ await artistAPI.update(editItem.id,editItem); toast.success('Updated'); setEditItem(null); fetch() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleDel=async()=>{ setDeleting(true); try{ await artistAPI.delete(delId); toast.success('Deleted'); setDelId(null); fetch() } catch(err){ toast.error(err.response?.data?.message||'Cannot delete') } finally{setDeleting(false)} }
  const handleToggle=async(id)=>{ try{ await artistAPI.toggle(id); toast.success('Status updated'); fetch() } catch{ toast.error('Failed') } }
  const handleExport=async()=>{ try{ const r=await artistAPI.exportExcel(); downloadBlob(r,'artists.xlsx'); toast.success('Downloaded!') } catch{ toast.error('Export failed') } }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input className="input pl-9" placeholder="Search artists..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button onClick={handleExport} className="btn-secondary text-sm py-2 px-3"><Download className="w-4 h-4"/>Excel</button>
        <button onClick={()=>setShowF(!showF)} className="btn-secondary text-sm py-2 px-3"><Filter className="w-4 h-4"/>Filters</button>
        <button onClick={()=>setShowAdd(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>Add Artist</button>
      </div>
      {showF && <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
        <select className="input w-36" value={statusF} onChange={e=>setStatusF(e.target.value)}><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        <select className="input w-48" value={artFormF} onChange={e=>setArtFormF(e.target.value)}><option value="">All Art Forms</option>{ART_FORMS.map(a=><option key={a}>{a}</option>)}</select>
        {(statusF||artFormF)&&<button onClick={()=>{setStatusF('');setArtFormF('')}} className="text-sm text-gray-400 flex items-center gap-1"><X className="w-3 h-3"/>Clear</button>}
      </div>}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr>{['Name','Email','Art Form','Location','Exp.','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading?<tr><td colSpan={7} className="py-16 text-center"><Loader className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></td></tr>
            :list.length===0?<tr><td colSpan={7} className="py-16 text-center text-gray-400">No artists found</td></tr>
            :list.map(a=>(
              <tr key={a.id}>
                <td className="td font-semibold text-dark">{a.full_name}</td>
                <td className="td text-gray-500 text-xs">{a.email}</td>
                <td className="td text-gray-600">{a.art_form}</td>
                <td className="td text-gray-600">{a.location}</td>
                <td className="td text-gray-600">{a.years_of_experience}y</td>
                <td className="td"><span className={a.status==='active'?'badge-active':'badge-inactive'}>{a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span></td>
                <td className="td"><div className="flex gap-1">
                  <IconBtn onClick={()=>setViewItem(a)}><Eye className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setEditItem({...a})}><Edit className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setDelId(a.id)} danger><Trash2 className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>handleToggle(a.id)} danger={a.status==='active'} success={a.status!=='active'}>
                    {a.status==='active'?<UserX className="w-4 h-4"/>:<UserCheck className="w-4 h-4"/>}
                  </IconBtn>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Artist" maxWidth="max-w-3xl">
        <ArtistForm f={form} setF={setForm} onSubmit={handleAdd} saving={saving} onCancel={()=>setShowAdd(false)} isNew/>
      </Modal>
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Edit Artist" maxWidth="max-w-3xl">
        {editItem&&<ArtistForm f={editItem} setF={setEditItem} onSubmit={handleEdit} saving={saving} onCancel={()=>setEditItem(null)}/>}
      </Modal>
      <Modal open={!!viewItem} onClose={()=>setViewItem(null)} title="Artist Details" maxWidth="max-w-2xl">
        {viewItem&&<ArtistView a={viewItem}/>}
      </Modal>
      <ConfirmModal open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDel} loading={deleting} title="Delete Artist" message="This will permanently delete the artist and their account."/>
    </div>
  )
}

function ArtistForm({f,setF,onSubmit,saving,onCancel,isNew}) {
  const F=k=>({value:f[k]||'',onChange:e=>setF({...f,[k]:e.target.value})})

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setF({...f, profile_photo: ev.target.result})
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Basic Info */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Basic Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name *</label><input className="input" {...F('full_name')} required/></div>
          <div><label className="label">Email *</label><input className="input" type="email" {...F('email')} required/></div>
          <div><label className="label">Phone *</label><input className="input" {...F('phone')} required/></div>
          {isNew&&<div><label className="label">Password</label><input className="input" type="password" {...F('password')}/></div>}
          <div><label className="label">Location *</label><select className="input" {...F('location')} required><option value="">Select</option>{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select></div>
          <div><label className="label">State *</label><select className="input" {...F('state')} required><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Experience (yrs)</label><input className="input" type="number" min="0" {...F('years_of_experience')}/></div>
          <div><label className="label">Aadhaar Number</label><input className="input" placeholder="12-digit number" maxLength={12} {...F('aadhaar_number')}/></div>
        </div>
      </div>

      {/* Art Form */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Artistic Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <OtherSelect label="Art Form" options={ART_FORMS} required
              value={f.art_form||''} otherValue={f.art_form_other}
              onChange={v=>setF({...f,art_form:v,art_form_other:''})}
              onOtherChange={v=>setF({...f,art_form_other:v})}/>
          </div>
          <OtherSelect label="Artistic Qualification" options={ART_QUALS}
            value={f.artistic_qualification||''} otherValue={f.artistic_qualification_other}
            onChange={v=>setF({...f,artistic_qualification:v,artistic_qualification_other:''})}
            onOtherChange={v=>setF({...f,artistic_qualification_other:v})}/>
        </div>
      </div>

      {/* Academic & Caste */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Academic & Category</p>
        <div className="grid grid-cols-2 gap-4">
          <OtherSelect label="Educational Qualification" options={EDU_QUALS}
            value={f.educational_qualification||''} otherValue={f.educational_qualification_other}
            onChange={v=>setF({...f,educational_qualification:v,educational_qualification_other:''})}
            onOtherChange={v=>setF({...f,educational_qualification_other:v})}/>
          <OtherSelect label="Caste Category" options={CASTES}
            value={f.caste||''} otherValue={f.caste_other}
            onChange={v=>setF({...f,caste:v,caste_other:''})}
            onOtherChange={v=>setF({...f,caste_other:v})}/>
        </div>
      </div>

      {/* Photo & Bio */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Photo & Biography</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Profile Photo (Passport Size)</label>
            <input type="file" accept="image/*" className="input py-2 text-sm" onChange={handlePhoto}/>
            {f.profile_photo && <img src={f.profile_photo} alt="Preview" className="mt-2 w-20 h-24 object-cover rounded border border-gray-200"/>}
          </div>
        </div>
        <div className="mt-3"><label className="label">Biography</label><textarea className="input resize-none h-20" {...F('biography')}/></div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving&&<Loader className="w-4 h-4 animate-spin"/>} {isNew?'Add Artist':'Save Changes'}</button>
      </div>
    </form>
  )
}

function ArtistView({a}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
        {a.profile_photo
          ? <img src={a.profile_photo} alt={a.full_name} className="w-16 h-20 object-cover rounded-xl border border-gray-200"/>
          : <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center"><span className="font-display font-bold text-2xl text-brand-600">{a.full_name?.[0]}</span></div>
        }
        <div>
          <h3 className="font-display font-bold text-xl">{a.full_name}</h3>
          <p className="text-sm text-gray-500">{a.art_form}{a.art_form_other ? ` — ${a.art_form_other}` : ''}</p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          <span className={a.status==='active'?'badge-active':'badge-inactive'}>{a.status}</span>
          <button onClick={()=>printArtistPDF(a)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            <Download className="w-3 h-3"/> PDF Proof
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6">
        {[
          ['Email',a.email],['Phone',a.phone],['Location',a.location],['State',a.state],
          ['Experience',`${a.years_of_experience} years`],
          ['Aadhaar',a.aadhaar_number ? `XXXX-XXXX-${a.aadhaar_number.slice(-4)}` : '—'],
          ['Educational Qual.',a.educational_qualification ? `${a.educational_qualification}${a.educational_qualification_other?` (${a.educational_qualification_other})`:''}` : '—'],
          ['Artistic Qual.',a.artistic_qualification ? `${a.artistic_qualification}${a.artistic_qualification_other?` (${a.artistic_qualification_other})`:''}` : '—'],
          ['Caste',a.caste ? `${a.caste}${a.caste_other?` (${a.caste_other})`:''}` : '—'],
        ].map(([k,v])=>(
          <div key={k} className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-semibold text-right max-w-[55%]">{v||'—'}</span></div>
        ))}
      </div>
      {a.biography&&<div><p className="text-sm text-gray-500 mb-1">Biography</p><p className="text-sm bg-gray-50 rounded-xl p-3">{a.biography}</p></div>}
    </div>
  )
}

// ═══════════════ EVENTS TAB ═══════════════
function EventsTab() {
  const [list,setList]=useState([]); const [venues,setVenues]=useState([]); const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState(''); const [showAdd,setShowAdd]=useState(false); const [editItem,setEditItem]=useState(null)
  const [viewItem,setViewItem]=useState(null); const [delId,setDelId]=useState(null); const [deleting,setDeleting]=useState(false); const [saving,setSaving]=useState(false)
  const empty={name:'',date:'',venue_id:'',art_form:'',participants_max:'',status:'upcoming',description:'',category:'Performing',press_links:[],event_photos:[]}
  const [form,setForm]=useState(empty)

  const fetchAll=useCallback(async()=>{
    setLoading(true)
    try{ const [er,vr]=await Promise.all([eventAPI.list(search?{search}:{}),venueAPI.list()])
      setList(er.data.data); setVenues(vr.data.data) }
    catch{ toast.error('Failed') } finally{ setLoading(false) }
  },[search])
  useEffect(()=>{fetchAll()},[fetchAll])

  const handleAdd=async(e)=>{ e.preventDefault(); setSaving(true); try{ await eventAPI.create(form); toast.success('Event created'); setShowAdd(false); setForm(empty); fetchAll() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleEdit=async(e)=>{ e.preventDefault(); setSaving(true); try{ await eventAPI.update(editItem.id,editItem); toast.success('Updated'); setEditItem(null); fetchAll() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleDel=async()=>{ setDeleting(true); try{ await eventAPI.delete(delId); toast.success('Deleted'); setDelId(null); fetchAll() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setDeleting(false)} }
  const handleExport=async()=>{ try{ const r=await eventAPI.exportExcel(); downloadBlob(r,'events.xlsx'); toast.success('Downloaded!') } catch{ toast.error('Export failed') } }

  const EventForm=({f,setF,onSub,onCan})=>{
    const handleEventPhoto = (e) => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return }
      const reader = new FileReader()
      reader.onload = ev => setF({...f, event_photos: [...(f.event_photos||[]), ev.target.result]})
      reader.readAsDataURL(file)
    }
    return (
      <form onSubmit={onSub} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Event Name *</label><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/></div>
          <div><label className="label">Date *</label><input className="input" type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})} required/></div>
          <div><label className="label">Venue *</label><select className="input" value={f.venue_id} onChange={e=>setF({...f,venue_id:e.target.value})} required><option value="">Select Venue</option>{venues.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
          <div><label className="label">Category *</label>
            <select className="input" value={f.category||'Performing'} onChange={e=>setF({...f,category:e.target.value})} required>
              {EVENT_CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Art Form *</label><select className="input" value={f.art_form} onChange={e=>setF({...f,art_form:e.target.value})} required><option value="">Select</option>{ART_FORMS.map(a=><option key={a}>{a}</option>)}</select></div>
          <div><label className="label">Max Participants *</label><input className="input" type="number" min="1" value={f.participants_max} onChange={e=>setF({...f,participants_max:e.target.value})} required/></div>
          <div><label className="label">Status</label><select className="input" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>
            {['upcoming','ongoing','completed','cancelled'].map(s=><option key={s}>{s}</option>)}
          </select></div>
          <div className="col-span-2"><label className="label">Description</label><textarea className="input resize-none h-16" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></div>
          <div className="col-span-2"><label className="label">Press / Media Links (one per line)</label>
            <textarea className="input resize-none h-16" placeholder="https://..." value={(f.press_links||[]).join('\n')} onChange={e=>setF({...f,press_links:e.target.value.split('\n').filter(Boolean)})}/>
          </div>
          <div className="col-span-2">
            <label className="label">Event Photos</label>
            <input type="file" accept="image/*" className="input py-2 text-sm" onChange={handleEventPhoto}/>
            {(f.event_photos||[]).length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {f.event_photos.map((p,i)=>(
                  <div key={i} className="relative">
                    <img src={p} alt={`photo-${i}`} className="w-16 h-16 object-cover rounded border border-gray-200"/>
                    <button type="button" onClick={()=>setF({...f,event_photos:f.event_photos.filter((_,j)=>j!==i)})} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onCan} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving&&<Loader className="w-4 h-4 animate-spin"/>} Save</button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input className="input pl-9" placeholder="Search events..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button onClick={handleExport} className="btn-secondary text-sm py-2 px-3"><Download className="w-4 h-4"/>Excel</button>
        <button onClick={()=>setShowAdd(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>Create Event</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr>{['Name','Date','Venue','Category','Art Form','Participants','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading?<tr><td colSpan={8} className="py-16 text-center"><Loader className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></td></tr>
            :list.length===0?<tr><td colSpan={8} className="py-16 text-center text-gray-400">No events found</td></tr>
            :list.map(ev=>(
              <tr key={ev.id}>
                <td className="td font-semibold text-dark">{ev.name}</td>
                <td className="td text-gray-600">{new Date(ev.date).toLocaleDateString('en-IN')}</td>
                <td className="td text-gray-600">{ev.venue_name}</td>
                <td className="td"><span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-xs font-medium">{ev.category||'Performing'}</span></td>
                <td className="td text-gray-600">{ev.art_form}</td>
                <td className="td text-gray-600">{ev.participants_current}/{ev.participants_max}</td>
                <td className="td"><span className={ev.status==='upcoming'?'badge-active':ev.status==='completed'?'badge-inactive':'badge-active'}>{ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span></td>
                <td className="td"><div className="flex gap-1">
                  <IconBtn onClick={()=>setViewItem(ev)}><Eye className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setEditItem({...ev,date:ev.date?.split('T')[0]||ev.date,press_links:ev.press_links||[],event_photos:ev.event_photos||[]})}><Edit className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setDelId(ev.id)} danger><Trash2 className="w-4 h-4"/></IconBtn>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Create Event" maxWidth="max-w-2xl"><EventForm f={form} setF={setForm} onSub={handleAdd} onCan={()=>setShowAdd(false)}/></Modal>
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Edit Event" maxWidth="max-w-2xl">{editItem&&<EventForm f={editItem} setF={setEditItem} onSub={handleEdit} onCan={()=>setEditItem(null)}/>}</Modal>
      <Modal open={!!viewItem} onClose={()=>setViewItem(null)} title="Event Details" maxWidth="max-w-lg">
        {viewItem&&<div className="space-y-3">
          {[['Name',viewItem.name],['Date',new Date(viewItem.date).toLocaleDateString('en-IN')],['Venue',viewItem.venue_name],['Category',viewItem.category||'Performing'],['Art Form',viewItem.art_form],['Participants',`${viewItem.participants_current}/${viewItem.participants_max}`],['Status',viewItem.status]].map(([k,v])=>(
            <div key={k} className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-semibold">{v}</span></div>
          ))}
          {viewItem.description&&<p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{viewItem.description}</p>}
          {(viewItem.press_links||[]).length>0&&<div><p className="text-sm text-gray-500 mb-1 font-medium">Press / Media Links</p>{viewItem.press_links.map((l,i)=><a key={i} href={l} target="_blank" rel="noreferrer" className="block text-xs text-brand-600 underline truncate">{l}</a>)}</div>}
          {(viewItem.event_photos||[]).length>0&&<div><p className="text-sm text-gray-500 mb-1 font-medium">Event Photos</p><div className="flex gap-2 flex-wrap">{viewItem.event_photos.map((p,i)=><img key={i} src={p} alt={`ep-${i}`} className="w-20 h-20 object-cover rounded border border-gray-200"/>)}</div></div>}
        </div>}
      </Modal>
      <ConfirmModal open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDel} loading={deleting} title="Delete Event"/>
    </div>
  )
}

// ═══════════════ VENUES TAB ═══════════════
function VenuesTab() {
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true); const [search,setSearch]=useState('')
  const [showAdd,setShowAdd]=useState(false); const [editItem,setEditItem]=useState(null); const [delId,setDelId]=useState(null)
  const [deleting,setDeleting]=useState(false); const [saving,setSaving]=useState(false)
  const empty={name:'',state:'',city:'',area_type:'Urban',capacity:''}
  const [form,setForm]=useState(empty)

  const fetch=useCallback(async()=>{ setLoading(true); try{ const r=await venueAPI.list(search?{search}:{}); setList(r.data.data) } catch{ toast.error('Failed') } finally{ setLoading(false) }},[search])
  useEffect(()=>{fetch()},[fetch])

  const handleAdd=async(e)=>{ e.preventDefault(); setSaving(true); try{ await venueAPI.create(form); toast.success('Venue added'); setShowAdd(false); setForm(empty); fetch() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleEdit=async(e)=>{ e.preventDefault(); setSaving(true); try{ await venueAPI.update(editItem.id,editItem); toast.success('Updated'); setEditItem(null); fetch() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleDel=async()=>{ setDeleting(true); try{ await venueAPI.delete(delId); toast.success('Deleted'); setDelId(null); fetch() } catch(err){ toast.error(err.response?.data?.message||'Cannot delete') } finally{setDeleting(false)} }
  const handleExport=async()=>{ try{ const r=await venueAPI.exportExcel(); downloadBlob(r,'venues.xlsx'); toast.success('Downloaded!') } catch{ toast.error('Export failed') } }

  const VenueForm=({f,setF,onSub,onCan})=>(
    <form onSubmit={onSub} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Venue Name *</label><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/></div>
        <div><label className="label">State *</label><select className="input" value={f.state} onChange={e=>setF({...f,state:e.target.value})} required><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className="label">City *</label><input className="input" value={f.city} onChange={e=>setF({...f,city:e.target.value})} required/></div>
        <div><label className="label">Area Type</label><select className="input" value={f.area_type} onChange={e=>setF({...f,area_type:e.target.value})}>{AREA_TYPES.map(a=><option key={a}>{a}</option>)}</select></div>
        <div><label className="label">Capacity *</label><input className="input" type="number" min="1" value={f.capacity} onChange={e=>setF({...f,capacity:e.target.value})} required/></div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCan} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving&&<Loader className="w-4 h-4 animate-spin"/>} Save</button>
      </div>
    </form>
  )

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input className="input pl-9" placeholder="Search venues..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button onClick={handleExport} className="btn-secondary text-sm py-2 px-3"><Download className="w-4 h-4"/>Excel</button>
        <button onClick={()=>setShowAdd(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>Add Venue</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr>{['Name','State','City','Area Type','Capacity','Events','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading?<tr><td colSpan={8} className="py-16 text-center"><Loader className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></td></tr>
            :list.length===0?<tr><td colSpan={8} className="py-16 text-center text-gray-400">No venues found</td></tr>
            :list.map(v=>(
              <tr key={v.id}>
                <td className="td font-semibold text-dark">{v.name}</td>
                <td className="td text-gray-600">{v.state}</td>
                <td className="td text-gray-600">{v.city}</td>
                <td className="td"><span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{v.area_type}</span></td>
                <td className="td text-gray-600">{v.capacity}</td>
                <td className="td text-gray-600">{v.total_events}</td>
                <td className="td"><span className={v.status==='active'?'badge-active':'badge-inactive'}>{v.status.charAt(0).toUpperCase()+v.status.slice(1)}</span></td>
                <td className="td"><div className="flex gap-1">
                  <IconBtn onClick={()=>setEditItem({...v})}><Edit className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setDelId(v.id)} danger><Trash2 className="w-4 h-4"/></IconBtn>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add Venue"><VenueForm f={form} setF={setForm} onSub={handleAdd} onCan={()=>setShowAdd(false)}/></Modal>
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Edit Venue">{editItem&&<VenueForm f={editItem} setF={setEditItem} onSub={handleEdit} onCan={()=>setEditItem(null)}/>}</Modal>
      <ConfirmModal open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDel} loading={deleting} title="Delete Venue" message="This will remove the venue permanently."/>
    </div>
  )
}

// ═══════════════ EXPENSES TAB ═══════════════
function ExpensesTab() {
  const [useRange, setUseRange] = useState(false)
  const [fy,setFy]=useState('2024-25')
  const [startDate,setStartDate]=useState('2024-04-01')
  const [endDate,setEndDate]=useState('2025-03-31')
  const [summary,setSummary]=useState(null); const [loading,setLoading]=useState(true)
  const [subTab,setSubTab]=useState('monthly'); const [showAdd,setShowAdd]=useState(false); const [saving,setSaving]=useState(false)
  const emptyExp={month:'Apr',year:'2024',amount:'',venue:'',equipment:'',travel:'',marketing:'',miscellaneous:'',remarks:''}
  const [form,setForm]=useState(emptyExp)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    const params = useRange ? {start_date:startDate,end_date:endDate} : {fy}
    try{ const r=await expenseAPI.summary(params); setSummary(r.data.data) } catch{ toast.error('Failed') } finally{ setLoading(false) }
  },[fy,useRange,startDate,endDate])

  useEffect(()=>{ loadSummary() },[loadSummary])

  const handleAdd=async(e)=>{ e.preventDefault(); setSaving(true); try{ await expenseAPI.create(form); toast.success('Expense added'); setShowAdd(false); setForm(emptyExp); loadSummary() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleExport=async()=>{
    const params = useRange ? {start_date:startDate,end_date:endDate} : {fy}
    try{ const r=await expenseAPI.exportExcel(params); downloadBlob(r,'expenses.xlsx'); toast.success('Downloaded!') } catch{ toast.error('Export failed') }
  }

  if(loading) return <div className="py-20 flex justify-center"><Loader className="w-8 h-8 animate-spin text-brand-400"/></div>
  if(!summary) return null

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-dark">Expense Tracking</h2>
          <p className="text-sm text-gray-500">{summary.label}</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={useRange} onChange={e=>setUseRange(e.target.checked)} className="rounded"/>
            Custom Date Range
          </label>
          {useRange ? (
            <>
              <input type="date" className="input w-36 text-sm" value={startDate} onChange={e=>setStartDate(e.target.value)}/>
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" className="input w-36 text-sm" value={endDate} onChange={e=>setEndDate(e.target.value)}/>
            </>
          ) : (
            <select className="input w-32" value={fy} onChange={e=>setFy(e.target.value)}>{FY_OPTIONS.map(f=><option key={f}>{f}</option>)}</select>
          )}
          <button onClick={handleExport} className="btn-secondary text-sm py-2 px-3"><Download className="w-4 h-4"/>Excel</button>
          <button onClick={()=>setShowAdd(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>Add Entry</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><p className="text-xs text-gray-500 mb-1">Total Expenses</p><p className="font-display text-2xl font-bold text-dark">{fmt(summary.total)}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500 mb-1">Avg Monthly</p><p className="font-display text-2xl font-bold text-dark">{fmt(summary.avgMonthly)}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><TrendingUp className="w-3 h-3 text-red-400"/>Highest</p><p className="font-display text-xl font-bold">{fmt(summary.highest?.amount)}</p><p className="text-xs text-gray-400">{summary.highest?.period}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><TrendingDown className="w-3 h-3 text-green-500"/>Lowest</p><p className="font-display text-xl font-bold">{fmt(summary.lowest?.amount)}</p><p className="text-xs text-gray-400">{summary.lowest?.period}</p></div>
      </div>
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {[['monthly','Monthly'],['category','Category-wise'],['table','Monthly Table']].map(([id,label])=>(
          <button key={id} onClick={()=>setSubTab(id)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${subTab===id?'bg-white shadow-sm text-brand-600':'text-gray-500'}`}>{label}</button>
        ))}
      </div>
      {subTab==='monthly' && (
        <div>
          <h3 className="font-display font-bold text-lg mb-4">Monthly Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary.monthly||[]} margin={{top:5,right:20,left:20,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3"/>
              <XAxis dataKey="month" tick={{fontSize:12,fill:'#9ca3af'}}/>
              <YAxis tick={{fontSize:11,fill:'#9ca3af'}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>[fmt(v)]}/>
              <Legend/>
              <Bar dataKey="categories.venue" stackId="a" fill="#ea580c" name="Venue"/>
              <Bar dataKey="categories.equipment" stackId="a" fill="#fb923c" name="Equipment"/>
              <Bar dataKey="categories.travel" stackId="a" fill="#fed7aa" name="Travel"/>
              <Bar dataKey="categories.marketing" stackId="a" fill="#fef3c7" name="Marketing"/>
              <Bar dataKey="categories.miscellaneous" stackId="a" fill="#e5e7eb" name="Misc" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {subTab==='category' && (
        <div>
          <h3 className="font-display font-bold text-lg mb-4">Category Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(summary.categoryTotals||{}).map(([cat,amt])=>(
              <div key={cat} className="stat-card">
                <p className="text-sm text-gray-500 capitalize">{cat}</p>
                <p className="font-display text-xl font-bold text-brand-600">{fmt(amt)}</p>
                <p className="text-xs text-gray-400">{summary.total?((amt/summary.total)*100).toFixed(1):0}% of total</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {subTab==='table' && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full">
            <thead><tr>{['Month','Year','Total','Venue','Equipment','Travel','Marketing','Misc','Remarks'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {(summary.monthly||[]).map(r=>(
                <tr key={`${r.month}-${r.year}`}>
                  <td className="td font-semibold">{r.month}</td>
                  <td className="td text-gray-600">{r.year}</td>
                  <td className="td font-semibold text-brand-600">{fmt(r.amount)}</td>
                  <td className="td text-gray-600">{fmt(r.categories.venue)}</td>
                  <td className="td text-gray-600">{fmt(r.categories.equipment)}</td>
                  <td className="td text-gray-600">{fmt(r.categories.travel)}</td>
                  <td className="td text-gray-600">{fmt(r.categories.marketing)}</td>
                  <td className="td text-gray-600">{fmt(r.categories.miscellaneous)}</td>
                  <td className="td text-gray-500 text-xs">{r.remarks||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add Expense Entry">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Month *</label><select className="input" value={form.month} onChange={e=>setForm({...form,month:e.target.value})}>
              {['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'].map(m=><option key={m}>{m}</option>)}
            </select></div>
            <div><label className="label">Year *</label><input className="input" type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} required/></div>
            <div><label className="label">Total Amount *</label><input className="input" type="number" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></div>
            <div><label className="label">Venue (₹)</label><input className="input" type="number" placeholder="0" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}/></div>
            <div><label className="label">Equipment (₹)</label><input className="input" type="number" placeholder="0" value={form.equipment} onChange={e=>setForm({...form,equipment:e.target.value})}/></div>
            <div><label className="label">Travel (₹)</label><input className="input" type="number" placeholder="0" value={form.travel} onChange={e=>setForm({...form,travel:e.target.value})}/></div>
            <div><label className="label">Marketing (₹)</label><input className="input" type="number" placeholder="0" value={form.marketing} onChange={e=>setForm({...form,marketing:e.target.value})}/></div>
            <div><label className="label">Miscellaneous (₹)</label><input className="input" type="number" placeholder="0" value={form.miscellaneous} onChange={e=>setForm({...form,miscellaneous:e.target.value})}/></div>
            <div className="col-span-2"><label className="label">Remarks</label><textarea className="input resize-none h-16" placeholder="Optional notes..." value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={()=>setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving&&<Loader className="w-4 h-4 animate-spin"/>} Add Expense</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ═══════════════ ARTIST EXPENSES TAB ═══════════════
function ArtistExpensesTab() {
  const [list,setList]=useState([]); const [artists,setArtists]=useState([]); const [events,setEvents]=useState([])
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [deleting,setDeleting]=useState(false)
  const [showAdd,setShowAdd]=useState(false); const [editItem,setEditItem]=useState(null); const [delId,setDelId]=useState(null)
  const [filterArtist,setFilterArtist]=useState('')
  const emptyExp={artist_id:'',event_id:'',performance_fee:'',travel_expense:'',accommodation_expense:'',other_expenses:'',remarks:''}
  const [form,setForm]=useState(emptyExp)

  const fetchAll=useCallback(async()=>{
    setLoading(true)
    try{
      const params={}; if(filterArtist) params.artist_id=filterArtist
      const [er,ar,evr]=await Promise.all([artistExpenseAPI.list(params),artistAPI.list({}),eventAPI.list({})])
      setList(er.data.data); setArtists(ar.data.data); setEvents(evr.data.data)
    } catch{ toast.error('Failed') } finally{ setLoading(false) }
  },[filterArtist])

  useEffect(()=>{fetchAll()},[fetchAll])

  const calcTotal = f => (Number(f.performance_fee||0)+Number(f.travel_expense||0)+Number(f.accommodation_expense||0)+Number(f.other_expenses||0))

  const handleAdd=async(e)=>{ e.preventDefault(); setSaving(true); try{ await artistExpenseAPI.create(form); toast.success('Expense added'); setShowAdd(false); setForm(emptyExp); fetchAll() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleEdit=async(e)=>{ e.preventDefault(); setSaving(true); try{ await artistExpenseAPI.update(editItem.id,editItem); toast.success('Updated'); setEditItem(null); fetchAll() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleDel=async()=>{ setDeleting(true); try{ await artistExpenseAPI.delete(delId); toast.success('Deleted'); setDelId(null); fetchAll() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setDeleting(false)} }

  const ExpenseForm=({f,setF,onSub,onCan,isNew})=>(
    <form onSubmit={onSub} className="space-y-4">
      {isNew && <>
        <div><label className="label">Artist *</label>
          <select className="input" value={f.artist_id} onChange={e=>setF({...f,artist_id:e.target.value})} required>
            <option value="">Select Artist</option>
            {artists.map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
        </div>
        <div><label className="label">Event (optional)</label>
          <select className="input" value={f.event_id} onChange={e=>setF({...f,event_id:e.target.value})}>
            <option value="">Select Event</option>
            {events.map(ev=><option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
      </>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Performance Fee (₹)</label><input className="input" type="number" min="0" placeholder="0" value={f.performance_fee||''} onChange={e=>setF({...f,performance_fee:e.target.value})}/></div>
        <div><label className="label">Travel Expense (₹)</label><input className="input" type="number" min="0" placeholder="0" value={f.travel_expense||''} onChange={e=>setF({...f,travel_expense:e.target.value})}/></div>
        <div><label className="label">Accommodation (₹)</label><input className="input" type="number" min="0" placeholder="0" value={f.accommodation_expense||''} onChange={e=>setF({...f,accommodation_expense:e.target.value})}/></div>
        <div><label className="label">Other Expenses (₹)</label><input className="input" type="number" min="0" placeholder="0" value={f.other_expenses||''} onChange={e=>setF({...f,other_expenses:e.target.value})}/></div>
      </div>
      <div className="p-3 bg-brand-50 rounded-xl"><p className="text-sm font-semibold text-brand-700">Total: {fmt(calcTotal(f))}</p></div>
      <div><label className="label">Remarks</label><textarea className="input resize-none h-16" placeholder="Optional notes..." value={f.remarks||''} onChange={e=>setF({...f,remarks:e.target.value})}/></div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCan} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving&&<Loader className="w-4 h-4 animate-spin"/>} {isNew?'Add Expense':'Save Changes'}</button>
      </div>
    </form>
  )

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <select className="input" value={filterArtist} onChange={e=>setFilterArtist(e.target.value)}>
            <option value="">All Artists</option>
            {artists.map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
        </div>
        <button onClick={()=>setShowAdd(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>Add Expense</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr>{['Artist','Event','Perf. Fee','Travel','Accom.','Other','Total','Remarks','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading?<tr><td colSpan={9} className="py-16 text-center"><Loader className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></td></tr>
            :list.length===0?<tr><td colSpan={9} className="py-16 text-center text-gray-400">No artist expenses recorded</td></tr>
            :list.map(e=>(
              <tr key={e.id}>
                <td className="td font-semibold text-dark">{e.artist_name}</td>
                <td className="td text-gray-500 text-xs">{e.event_name||'—'}</td>
                <td className="td text-gray-600">{fmt(e.performance_fee)}</td>
                <td className="td text-gray-600">{fmt(e.travel_expense)}</td>
                <td className="td text-gray-600">{fmt(e.accommodation_expense)}</td>
                <td className="td text-gray-600">{fmt(e.other_expenses)}</td>
                <td className="td font-semibold text-brand-600">{fmt(e.total_expense)}</td>
                <td className="td text-gray-500 text-xs max-w-[120px] truncate">{e.remarks||'—'}</td>
                <td className="td"><div className="flex gap-1">
                  <IconBtn onClick={()=>setEditItem({...e})}><Edit className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setDelId(e.id)} danger><Trash2 className="w-4 h-4"/></IconBtn>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add Artist Expense" maxWidth="max-w-lg">
        <ExpenseForm f={form} setF={setForm} onSub={handleAdd} onCan={()=>setShowAdd(false)} isNew/>
      </Modal>
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Edit Artist Expense" maxWidth="max-w-lg">
        {editItem&&<ExpenseForm f={editItem} setF={setEditItem} onSub={handleEdit} onCan={()=>setEditItem(null)}/>}
      </Modal>
      <ConfirmModal open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDel} loading={deleting} title="Delete Artist Expense"/>
    </div>
  )
}

// ═══════════════ REPORTS TAB ═══════════════
function ReportsTab() {
  const [fy,setFy]=useState('2024-25'); const [report,setReport]=useState(null); const [loading,setLoading]=useState(true); const [subTab,setSubTab]=useState('monthly')

  useEffect(()=>{ setLoading(true); reportAPI.annual(fy).then(r=>setReport(r.data.data)).catch(()=>toast.error('Failed')).finally(()=>setLoading(false)) },[fy])

  if(loading) return <div className="py-20 flex justify-center"><Loader className="w-8 h-8 animate-spin text-brand-400"/></div>
  if(!report) return null
  const {summary,monthlyActivity,artFormBreakdown,artistSummary}=report

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div><h2 className="font-display text-xl font-bold text-dark">Annual Reports — FY {fy}</h2><p className="text-sm text-gray-500">Year-end summary and analytics</p></div>
        <div className="ml-auto flex gap-3">
          <select className="input w-32" value={fy} onChange={e=>setFy(e.target.value)}>{FY_OPTIONS.map(f=><option key={f}>{f}</option>)}</select>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><p className="text-sm text-gray-500">Total Artists</p><p className="font-display text-3xl font-bold text-brand-600">{summary.totalArtists}</p><p className="text-xs text-green-500">{summary.growthFromLastFY?.artists} from last FY</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Total Events</p><p className="font-display text-3xl font-bold text-brand-600">{summary.totalEvents}</p><p className="text-xs text-green-500">{summary.growthFromLastFY?.events} from last FY</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Total Venues</p><p className="font-display text-3xl font-bold text-brand-600">{summary.totalVenues}</p><p className="text-xs text-green-500">{summary.growthFromLastFY?.venues} from last FY</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Total Expenses</p><p className="font-display text-2xl font-bold text-brand-600">{fmt(summary.totalExpenses)}</p><p className="text-xs text-green-500">{summary.growthFromLastFY?.expenses} from last FY</p></div>
      </div>
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {[['monthly','Monthly Activity'],['artists','Artist Summary']].map(([id,label])=>(
          <button key={id} onClick={()=>setSubTab(id)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${subTab===id?'bg-white shadow-sm text-brand-600':'text-gray-500'}`}>{label}</button>
        ))}
      </div>
      {subTab==='monthly' && (
        <div>
          <h3 className="font-display font-bold text-lg mb-4">Monthly Event Activity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyActivity||[]} margin={{top:5,right:20,left:0,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3"/>
              <XAxis dataKey="month" tick={{fontSize:12,fill:'#9ca3af'}}/>
              <YAxis tick={{fontSize:11,fill:'#9ca3af'}}/>
              <Tooltip/>
              <Line type="monotone" dataKey="events" stroke="#ea580c" strokeWidth={2} dot={{fill:'#ea580c',r:4}} name="Events"/>
            </LineChart>
          </ResponsiveContainer>
          <h3 className="font-display font-bold text-lg mt-8 mb-4">Art Form Distribution</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(artFormBreakdown||{}).map(([form,count])=>(
              <div key={form} className="stat-card"><p className="text-xs text-gray-500">{form}</p><p className="font-display text-2xl font-bold text-brand-600">{count}</p></div>
            ))}
          </div>
        </div>
      )}
      {subTab==='artists' && (
        <div>
          <h3 className="font-display font-bold text-lg mb-4">Artist Performance Summary</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full">
              <thead><tr>{['Name','Art Form','Location','Experience','Events','Status'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {artistSummary?.map(a=>(
                  <tr key={a.id}>
                    <td className="td font-semibold">{a.full_name}</td>
                    <td className="td text-gray-600">{a.art_form}</td>
                    <td className="td text-gray-600">{a.location}</td>
                    <td className="td text-gray-600">{a.years_of_experience} yrs</td>
                    <td className="td text-gray-600">{a.events_count}</td>
                    <td className="td"><span className={a.status==='active'?'badge-active':'badge-inactive'}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
