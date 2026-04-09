import { useState, useEffect, useCallback } from 'react'
import { Users, Calendar, MapPin, DollarSign, FileText, Search, Plus, Eye, Edit, Trash2, UserCheck, UserX, Filter, Download, Loader, X, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import toast from 'react-hot-toast'
import { Navbar, StatCard, Modal, ConfirmModal, IconBtn } from '../components/common/index.jsx'
import { artistAPI, eventAPI, venueAPI, expenseAPI, reportAPI, downloadBlob } from '../utils/api'

const ART_FORMS = ['Traditional Dance','Classical Music','Pottery','Folk Painting','Traditional Theatre','Weaving','Wood Carving','Sculpture','Embroidery','Puppetry','Folk Music']
const LOCATIONS = ['Mumbai','Delhi','Bangalore','Chennai','Kolkata','Jaipur','Lucknow','Hyderabad','Pune','Ahmedabad']
const STATES    = ['Maharashtra','Madhya Pradesh','Karnataka','Chhattisgarh','Andra Pradesh','Telangana','Others']
const AREA_TYPES = ['Urban','Semi-Urban','Rural']
const FY_OPTIONS = ['2024-25','2023-24','2022-23']
const fmt = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0)

export default function AdminPortal() {
  const [tab, setTab] = useState('artists')
  const [dash, setDash] = useState({})

  useEffect(()=>{ reportAPI.dashboard().then(r=>setDash(r.data.data)).catch(()=>{}) },[])

  const TABS = [{id:'artists',label:'Artists',icon:Users},{id:'events',label:'Events',icon:Calendar},{id:'venues',label:'Venues',icon:MapPin},{id:'expenses',label:'Expenses',icon:DollarSign},{id:'reports',label:'Reports',icon:FileText}]

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
            {tab==='artists'  && <ArtistsTab/>}
            {tab==='events'   && <EventsTab/>}
            {tab==='venues'   && <VenuesTab/>}
            {tab==='expenses' && <ExpensesTab/>}
            {tab==='reports'  && <ReportsTab/>}
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
  const empty={full_name:'',email:'',phone:'',art_form:'',location:'',state:'',years_of_experience:'',biography:'',password:'Password@123'}
  const [form,setForm]=useState(empty)

  const fetch=useCallback(async()=>{
    setLoading(true)
    try{ const p={}; if(search)p.search=search; if(statusF)p.status=statusF; if(artFormF)p.art_form=artFormF
      const r=await artistAPI.list(p); setList(r.data.data) }
    catch{ toast.error('Failed') } finally{ setLoading(false) }
  },[search,statusF,artFormF])

  useEffect(()=>{fetch()},[fetch])

  const handleAdd=async(e)=>{ e.preventDefault(); setSaving(true); try{ await artistAPI.create(form); toast.success('Artist added'); setShowAdd(false); setForm(empty); fetch() } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
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
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Artist" maxWidth="max-w-2xl">
        <ArtistForm f={form} setF={setForm} onSubmit={handleAdd} saving={saving} onCancel={()=>setShowAdd(false)} isNew/>
      </Modal>
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Edit Artist" maxWidth="max-w-2xl">
        {editItem&&<ArtistForm f={editItem} setF={setEditItem} onSubmit={handleEdit} saving={saving} onCancel={()=>setEditItem(null)}/>}
      </Modal>
      <Modal open={!!viewItem} onClose={()=>setViewItem(null)} title="Artist Details">
        {viewItem&&<ArtistView a={viewItem}/>}
      </Modal>
      <ConfirmModal open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDel} loading={deleting} title="Delete Artist" message="This will permanently delete the artist and their account."/>
    </div>
  )
}

function ArtistForm({f,setF,onSubmit,saving,onCancel,isNew}) {
  const F=k=>({value:f[k]||'',onChange:e=>setF({...f,[k]:e.target.value})})
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Full Name *</label><input className="input" {...F('full_name')} required/></div>
        <div><label className="label">Email *</label><input className="input" type="email" {...F('email')} required/></div>
        <div><label className="label">Phone *</label><input className="input" {...F('phone')} required/></div>
        <div><label className="label">Art Form *</label><select className="input" {...F('art_form')} required><option value="">Select</option>{ART_FORMS.map(a=><option key={a}>{a}</option>)}</select></div>
        <div><label className="label">Location *</label><select className="input" {...F('location')} required><option value="">Select</option>{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select></div>
        <div><label className="label">State *</label><select className="input" {...F('state')} required><option value="">Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className="label">Experience (yrs)</label><input className="input" type="number" min="0" {...F('years_of_experience')}/></div>
        {isNew&&<div><label className="label">Password</label><input className="input" type="password" {...F('password')}/></div>}
      </div>
      <div><label className="label">Biography</label><textarea className="input resize-none h-20" {...F('biography')}/></div>
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
        <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center"><span className="font-display font-bold text-2xl text-brand-600">{a.full_name?.[0]}</span></div>
        <div><h3 className="font-display font-bold text-xl">{a.full_name}</h3><p className="text-sm text-gray-500">{a.art_form}</p></div>
        <span className={`ml-auto ${a.status==='active'?'badge-active':'badge-inactive'}`}>{a.status}</span>
      </div>
      {[['Email',a.email],['Phone',a.phone],['Location',a.location],['State',a.state],['Experience',`${a.years_of_experience} years`]].map(([k,v])=>(
        <div key={k} className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-semibold">{v||'—'}</span></div>
      ))}
      {a.biography&&<div><p className="text-sm text-gray-500 mb-1">Biography</p><p className="text-sm bg-gray-50 rounded-xl p-3">{a.biography}</p></div>}
    </div>
  )
}

// ═══════════════ EVENTS TAB ═══════════════
function EventsTab() {
  const [list,setList]=useState([]); const [venues,setVenues]=useState([]); const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState(''); const [showAdd,setShowAdd]=useState(false); const [editItem,setEditItem]=useState(null)
  const [viewItem,setViewItem]=useState(null); const [delId,setDelId]=useState(null); const [deleting,setDeleting]=useState(false); const [saving,setSaving]=useState(false)
  const empty={name:'',date:'',venue_id:'',art_form:'',participants_max:'',status:'upcoming',description:''}
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

  const EventForm=({f,setF,onSub,onCan})=>(
    <form onSubmit={onSub} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Event Name *</label><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/></div>
        <div><label className="label">Date *</label><input className="input" type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})} required/></div>
        <div><label className="label">Venue *</label><select className="input" value={f.venue_id} onChange={e=>setF({...f,venue_id:e.target.value})} required><option value="">Select Venue</option>{venues.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
        <div><label className="label">Art Form *</label><select className="input" value={f.art_form} onChange={e=>setF({...f,art_form:e.target.value})} required><option value="">Select</option>{ART_FORMS.map(a=><option key={a}>{a}</option>)}</select></div>
        <div><label className="label">Max Participants *</label><input className="input" type="number" min="1" value={f.participants_max} onChange={e=>setF({...f,participants_max:e.target.value})} required/></div>
        <div><label className="label">Status</label><select className="input" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>
          {['upcoming','ongoing','completed','cancelled'].map(s=><option key={s}>{s}</option>)}
        </select></div>
        <div className="col-span-2"><label className="label">Description</label><textarea className="input resize-none h-16" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></div>
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
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input className="input pl-9" placeholder="Search events..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button onClick={handleExport} className="btn-secondary text-sm py-2 px-3"><Download className="w-4 h-4"/>Excel</button>
        <button onClick={()=>setShowAdd(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>Create Event</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr>{['Name','Date','Venue','Art Form','Participants','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading?<tr><td colSpan={7} className="py-16 text-center"><Loader className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></td></tr>
            :list.length===0?<tr><td colSpan={7} className="py-16 text-center text-gray-400">No events found</td></tr>
            :list.map(ev=>(
              <tr key={ev.id}>
                <td className="td font-semibold text-dark">{ev.name}</td>
                <td className="td text-gray-600">{new Date(ev.date).toLocaleDateString('en-IN')}</td>
                <td className="td text-gray-600">{ev.venue_name}</td>
                <td className="td text-gray-600">{ev.art_form}</td>
                <td className="td text-gray-600">{ev.participants_current}/{ev.participants_max}</td>
                <td className="td"><span className={ev.status==='upcoming'?'badge-active':ev.status==='completed'?'badge-inactive':'badge-active'}>{ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span></td>
                <td className="td"><div className="flex gap-1">
                  <IconBtn onClick={()=>setViewItem(ev)}><Eye className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setEditItem({...ev,date:ev.date?.split('T')[0]||ev.date})}><Edit className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setDelId(ev.id)} danger><Trash2 className="w-4 h-4"/></IconBtn>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Create Event" maxWidth="max-w-2xl"><EventForm f={form} setF={setForm} onSub={handleAdd} onCan={()=>setShowAdd(false)}/></Modal>
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Edit Event" maxWidth="max-w-2xl">{editItem&&<EventForm f={editItem} setF={setEditItem} onSub={handleEdit} onCan={()=>setEditItem(null)}/>}</Modal>
      <Modal open={!!viewItem} onClose={()=>setViewItem(null)} title="Event Details">
        {viewItem&&<div className="space-y-3">
          {[['Name',viewItem.name],['Date',new Date(viewItem.date).toLocaleDateString('en-IN')],['Venue',viewItem.venue_name],['Art Form',viewItem.art_form],['Participants',`${viewItem.participants_current}/${viewItem.participants_max}`],['Status',viewItem.status]].map(([k,v])=>(
            <div key={k} className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-semibold">{v}</span></div>
          ))}
          {viewItem.description&&<p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{viewItem.description}</p>}
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
  const [fy,setFy]=useState('2024-25'); const [summary,setSummary]=useState(null); const [loading,setLoading]=useState(true)
  const [subTab,setSubTab]=useState('monthly'); const [showAdd,setShowAdd]=useState(false); const [saving,setSaving]=useState(false)
  const emptyExp={month:'Apr',year:'2024',amount:'',venue:'',equipment:'',travel:'',marketing:'',miscellaneous:''}
  const [form,setForm]=useState(emptyExp)

  useEffect(()=>{ setLoading(true); expenseAPI.summary(fy).then(r=>setSummary(r.data.data)).catch(()=>toast.error('Failed')).finally(()=>setLoading(false)) },[fy])

  const handleAdd=async(e)=>{ e.preventDefault(); setSaving(true); try{ await expenseAPI.create(form); toast.success('Expense added'); setShowAdd(false); setForm(emptyExp); expenseAPI.summary(fy).then(r=>setSummary(r.data.data)) } catch(err){ toast.error(err.response?.data?.message||'Failed') } finally{setSaving(false)} }
  const handleExport=async()=>{ try{ const r=await expenseAPI.exportExcel(fy); downloadBlob(r,`expenses-${fy}.xlsx`); toast.success('Downloaded!') } catch{ toast.error('Export failed') } }

  if(loading) return <div className="py-20 flex justify-center"><Loader className="w-8 h-8 animate-spin text-brand-400"/></div>
  if(!summary) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-display text-xl font-bold text-dark">Expense Tracking</h2><p className="text-sm text-gray-500">Financial Year {fy}</p></div>
        <div className="flex gap-3">
          <select className="input w-32" value={fy} onChange={e=>setFy(e.target.value)}>{FY_OPTIONS.map(f=><option key={f}>{f}</option>)}</select>
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
        {[['monthly','Monthly'],['category','Category-wise']].map(([id,label])=>(
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
