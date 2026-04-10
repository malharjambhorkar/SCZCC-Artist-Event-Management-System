import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, Edit, UserCheck, UserX, Filter, Download, Loader, X, Users, Calendar, DollarSign, Receipt, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar, StatCard, Modal, ConfirmModal, IconBtn } from '../components/common/index.jsx'
import { artistAPI, artistExpenseAPI, eventAPI, venueAPI, expenseAPI, downloadBlob } from '../utils/api'

const ART_FORMS = ['Traditional Dance','Classical Music','Pottery','Folk Painting','Traditional Theatre','Weaving','Wood Carving','Sculpture','Embroidery','Puppetry','Folk Music']
const STATES    = ['Maharashtra','Madhya Pradesh','Karnataka','Chhattisgarh','Andra Pradesh','Telangana','Others']
const EVENT_CATEGORIES = ['Performing','Workshops']
const FY_OPTIONS = ['2024-25','2023-24','2022-23']
const fmt = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0)

export default function ClerkPortal() {
  const [tab, setTab] = useState('artists')

  const TABS = [
    {id:'artists',      label:'Artists',         icon:Users},
    {id:'events',       label:'Events',          icon:Calendar},
    {id:'budget',       label:'Budget',          icon:DollarSign},
    {id:'art-expenses', label:'Artist Expenses', icon:Receipt},
  ]

  return (
    <div className="min-h-screen bg-cream">
      <Navbar/>
      <main className="max-w-7xl mx-auto px-6 py-10 page-in">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-dark">Artist Management</h1>
          <p className="text-gray-500 mt-1">View and manage artists, events, budget and expenses</p>
        </div>
        <div className="card overflow-hidden">
          <div className="flex bg-gray-50 border-b border-gray-100 p-1.5 gap-1 overflow-x-auto">
            {TABS.map(t=>{ const Icon=t.icon; return (
              <button key={t.id} onClick={()=>setTab(t.id)} className={`tab-btn flex-1 justify-center min-w-[110px] ${tab===t.id?'tab-active':'tab-inactive'}`}>
                <Icon className="w-4 h-4"/>{t.label}
              </button>
            )})}
          </div>
          <div className="p-6">
            {tab==='artists'      && <ClerkArtistsTab/>}
            {tab==='events'       && <ClerkEventsTab/>}
            {tab==='budget'       && <ClerkBudgetTab/>}
            {tab==='art-expenses' && <ClerkArtistExpensesTab/>}
          </div>
        </div>
      </main>
    </div>
  )
}

// ═══════════════ ARTISTS TAB ═══════════════
function ClerkArtistsTab() {
  const [artists, setArtists] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [artFormF, setArtFormF] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewItem, setViewItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (statusF) params.status = statusF
      if (artFormF) params.art_form = artFormF
      const [ar, sr] = await Promise.all([artistAPI.list(params), artistAPI.stats()])
      setArtists(ar.data.data); setStats(sr.data.data)
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }, [search, statusF, artFormF])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleToggle = async (id) => {
    try { await artistAPI.toggle(id); toast.success('Status updated'); fetchAll() }
    catch { toast.error('Failed') }
  }

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await artistAPI.update(editItem.id, editItem); toast.success('Updated'); setEditItem(null); fetchAll() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  const handleExport = async () => {
    try { const r = await artistAPI.exportExcel(); downloadBlob(r, 'artists.xlsx'); toast.success('Downloaded!') }
    catch { toast.error('Export failed') }
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Artists"    value={stats.total||0}              icon={Users} color="text-brand-600"/>
        <StatCard label="Active"           value={stats.active||0}             color="text-brand-500"/>
        <StatCard label="Inactive"         value={stats.inactive||0}           color="text-gray-500"/>
        <StatCard label="Added This Month" value={`+${stats.addedThisMonth||0}`} color="text-brand-600"/>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input className="input pl-9" placeholder="Search artists..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <button onClick={handleExport} className="btn-secondary text-sm py-2 px-3"><Download className="w-4 h-4"/>Excel</button>
        <button onClick={()=>setShowFilters(!showFilters)} className="btn-secondary text-sm py-2 px-3"><Filter className="w-4 h-4"/>Filters</button>
      </div>

      {showFilters && <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
        <select className="input w-36" value={statusF} onChange={e=>setStatusF(e.target.value)}>
          <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <select className="input w-48" value={artFormF} onChange={e=>setArtFormF(e.target.value)}>
          <option value="">All Art Forms</option>{ART_FORMS.map(a=><option key={a}>{a}</option>)}
        </select>
        {(statusF||artFormF) && <button onClick={()=>{setStatusF('');setArtFormF('')}} className="text-sm text-gray-400 flex items-center gap-1"><X className="w-3 h-3"/>Clear</button>}
      </div>}

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr>{['Name','Art Form','Location','Experience','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={6} className="py-16 text-center"><Loader className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></td></tr>
            : artists.length===0 ? <tr><td colSpan={6} className="py-16 text-center text-gray-400">No artists found</td></tr>
            : artists.map(a=>(
              <tr key={a.id}>
                <td className="td font-semibold text-dark">{a.full_name}</td>
                <td className="td text-gray-600">{a.art_form}</td>
                <td className="td text-gray-600">{a.location}</td>
                <td className="td text-gray-600">{a.years_of_experience} yrs</td>
                <td className="td"><span className={a.status==='active'?'badge-active':'badge-inactive'}>{a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span></td>
                <td className="td">
                  <div className="flex gap-1.5">
                    <IconBtn onClick={()=>setViewItem(a)}><Eye className="w-4 h-4"/></IconBtn>
                    <IconBtn onClick={()=>setEditItem({...a})}><Edit className="w-4 h-4"/></IconBtn>
                    <IconBtn onClick={()=>handleToggle(a.id)} danger={a.status==='active'} success={a.status!=='active'}>
                      {a.status==='active'?<UserX className="w-4 h-4"/>:<UserCheck className="w-4 h-4"/>}
                    </IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewItem} onClose={()=>setViewItem(null)} title="Artist Profile" maxWidth="max-w-2xl">
        {viewItem && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              {viewItem.profile_photo
                ? <img src={viewItem.profile_photo} alt={viewItem.full_name} className="w-16 h-20 object-cover rounded-xl border border-gray-200"/>
                : <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center"><span className="font-display font-bold text-2xl text-brand-600">{viewItem.full_name?.[0]}</span></div>
              }
              <div><h3 className="font-display font-bold text-xl">{viewItem.full_name}</h3><p className="text-sm text-gray-500">{viewItem.art_form}</p></div>
              <span className={`ml-auto ${viewItem.status==='active'?'badge-active':'badge-inactive'}`}>{viewItem.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              {[
                ['Email',viewItem.email],['Phone',viewItem.phone],['Location',viewItem.location],['State',viewItem.state],
                ['Experience',`${viewItem.years_of_experience} years`],
                ['Aadhaar',viewItem.aadhaar_number ? `XXXX-XXXX-${viewItem.aadhaar_number.slice(-4)}` : '—'],
                ['Educational Qual.',viewItem.educational_qualification||'—'],
                ['Artistic Qual.',viewItem.artistic_qualification||'—'],
                ['Caste',viewItem.caste||'—'],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-semibold">{v||'—'}</span></div>
              ))}
            </div>
            {viewItem.biography && <div><p className="text-sm text-gray-500 mb-1">Biography</p><p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{viewItem.biography}</p></div>}
          </div>
        )}
      </Modal>

      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Edit Artist" maxWidth="max-w-2xl">
        {editItem && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input className="input" value={editItem.full_name} onChange={e=>setEditItem({...editItem,full_name:e.target.value})}/></div>
              <div><label className="label">Phone</label><input className="input" value={editItem.phone} onChange={e=>setEditItem({...editItem,phone:e.target.value})}/></div>
              <div><label className="label">Art Form</label>
                <select className="input" value={editItem.art_form} onChange={e=>setEditItem({...editItem,art_form:e.target.value})}>
                  {ART_FORMS.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              <div><label className="label">Experience (yrs)</label><input className="input" type="number" value={editItem.years_of_experience} onChange={e=>setEditItem({...editItem,years_of_experience:e.target.value})}/></div>
            </div>
            <div><label className="label">Biography</label><textarea className="input resize-none h-20" value={editItem.biography} onChange={e=>setEditItem({...editItem,biography:e.target.value})}/></div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={()=>setEditItem(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving&&<Loader className="w-4 h-4 animate-spin"/>} Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

// ═══════════════ EVENTS TAB (Clerk) ═══════════════
function ClerkEventsTab() {
  const [list, setList] = useState([]); const [venues, setVenues] = useState([]); const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(''); const [showAdd, setShowAdd] = useState(false); const [editItem, setEditItem] = useState(null)
  const [viewItem, setViewItem] = useState(null); const [saving, setSaving] = useState(false)
  const empty = {name:'',date:'',venue_id:'',art_form:'',participants_max:'',status:'upcoming',description:'',category:'Performing',press_links:[],event_photos:[]}
  const [form, setForm] = useState(empty)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [er, vr] = await Promise.all([eventAPI.list(search?{search}:{}), venueAPI.list()])
      setList(er.data.data); setVenues(vr.data.data)
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }, [search])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleAdd = async (e) => { e.preventDefault(); setSaving(true); try { await eventAPI.create(form); toast.success('Event created'); setShowAdd(false); setForm(empty); fetchAll() } catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setSaving(false) } }
  const handleEdit = async (e) => { e.preventDefault(); setSaving(true); try { await eventAPI.update(editItem.id, editItem); toast.success('Updated'); setEditItem(null); fetchAll() } catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setSaving(false) } }

  const EventForm = ({f,setF,onSub,onCan}) => (
    <form onSubmit={onSub} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Event Name *</label><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/></div>
        <div><label className="label">Date *</label><input className="input" type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})} required/></div>
        <div><label className="label">Venue *</label><select className="input" value={f.venue_id} onChange={e=>setF({...f,venue_id:e.target.value})} required><option value="">Select Venue</option>{venues.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
        <div><label className="label">Category *</label>
          <select className="input" value={f.category||'Performing'} onChange={e=>setF({...f,category:e.target.value})}>
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
        <button onClick={()=>setShowAdd(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>Create Event</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead><tr>{['Name','Date','Venue','Category','Art Form','Status','Actions'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading?<tr><td colSpan={7} className="py-16 text-center"><Loader className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></td></tr>
            :list.length===0?<tr><td colSpan={7} className="py-16 text-center text-gray-400">No events found</td></tr>
            :list.map(ev=>(
              <tr key={ev.id}>
                <td className="td font-semibold text-dark">{ev.name}</td>
                <td className="td text-gray-600">{new Date(ev.date).toLocaleDateString('en-IN')}</td>
                <td className="td text-gray-600">{ev.venue_name}</td>
                <td className="td"><span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-xs font-medium">{ev.category||'Performing'}</span></td>
                <td className="td text-gray-600">{ev.art_form}</td>
                <td className="td"><span className={ev.status==='upcoming'?'badge-active':ev.status==='completed'?'badge-inactive':'badge-active'}>{ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span></td>
                <td className="td"><div className="flex gap-1">
                  <IconBtn onClick={()=>setViewItem(ev)}><Eye className="w-4 h-4"/></IconBtn>
                  <IconBtn onClick={()=>setEditItem({...ev,date:ev.date?.split('T')[0]||ev.date,press_links:ev.press_links||[],event_photos:ev.event_photos||[]})}><Edit className="w-4 h-4"/></IconBtn>
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
          {[['Name',viewItem.name],['Date',new Date(viewItem.date).toLocaleDateString('en-IN')],['Venue',viewItem.venue_name],['Category',viewItem.category||'Performing'],['Art Form',viewItem.art_form],['Status',viewItem.status]].map(([k,v])=>(
            <div key={k} className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-semibold">{v}</span></div>
          ))}
          {viewItem.description&&<p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{viewItem.description}</p>}
          {(viewItem.press_links||[]).length>0&&<div><p className="text-sm font-medium text-gray-500 mb-1">Press Links</p>{viewItem.press_links.map((l,i)=><a key={i} href={l} target="_blank" rel="noreferrer" className="block text-xs text-brand-600 underline truncate">{l}</a>)}</div>}
        </div>}
      </Modal>
    </div>
  )
}

// ═══════════════ BUDGET TAB (Clerk) ═══════════════
function ClerkBudgetTab() {
  const [useRange, setUseRange] = useState(false)
  const [fy, setFy] = useState('2024-25')
  const [startDate, setStartDate] = useState('2024-04-01')
  const [endDate, setEndDate] = useState('2025-03-31')
  const [summary, setSummary] = useState(null); const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false); const [saving, setSaving] = useState(false)
  const emptyExp = {month:'Apr',year:'2024',amount:'',venue:'',equipment:'',travel:'',marketing:'',miscellaneous:'',remarks:''}
  const [form, setForm] = useState(emptyExp)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    const params = useRange ? {start_date:startDate,end_date:endDate} : {fy}
    try { const r = await expenseAPI.summary(params); setSummary(r.data.data) } catch { toast.error('Failed') } finally { setLoading(false) }
  }, [fy, useRange, startDate, endDate])

  useEffect(() => { loadSummary() }, [loadSummary])

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await expenseAPI.create(form); toast.success('Expense added'); setShowAdd(false); setForm(emptyExp); loadSummary() }
    catch (err) { toast.error(err.response?.data?.message||'Failed') } finally { setSaving(false) }
  }

  const handleExport = async () => {
    const params = useRange ? {start_date:startDate,end_date:endDate} : {fy}
    try { const r = await expenseAPI.exportExcel(params); downloadBlob(r,'expenses.xlsx'); toast.success('Downloaded!') }
    catch { toast.error('Export failed') }
  }

  if (loading) return <div className="py-20 flex justify-center"><Loader className="w-8 h-8 animate-spin text-brand-400"/></div>
  if (!summary) return null

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-dark">Budget Tracking</h2>
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
        <div className="stat-card"><p className="text-xs text-gray-500 mb-1">Total</p><p className="font-display text-2xl font-bold text-dark">{fmt(summary.total)}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500 mb-1">Avg Monthly</p><p className="font-display text-2xl font-bold text-dark">{fmt(summary.avgMonthly)}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500 mb-1">Highest</p><p className="font-display text-xl font-bold">{fmt(summary.highest?.amount)}</p><p className="text-xs text-gray-400">{summary.highest?.period}</p></div>
        <div className="stat-card"><p className="text-xs text-gray-500 mb-1">Lowest</p><p className="font-display text-xl font-bold">{fmt(summary.lowest?.amount)}</p><p className="text-xs text-gray-400">{summary.lowest?.period}</p></div>
      </div>

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

// ═══════════════ ARTIST EXPENSES TAB (Clerk) ═══════════════
function ClerkArtistExpensesTab() {
  const [list, setList] = useState([]); const [artists, setArtists] = useState([]); const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false); const [editItem, setEditItem] = useState(null)
  const [filterArtist, setFilterArtist] = useState('')
  const emptyExp = {artist_id:'',event_id:'',performance_fee:'',travel_expense:'',accommodation_expense:'',other_expenses:'',remarks:''}
  const [form, setForm] = useState(emptyExp)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}; if (filterArtist) params.artist_id = filterArtist
      const [er, ar, evr] = await Promise.all([artistExpenseAPI.list(params), artistAPI.list({}), eventAPI.list({})])
      setList(er.data.data); setArtists(ar.data.data); setEvents(evr.data.data)
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }, [filterArtist])

  useEffect(() => { fetchAll() }, [fetchAll])

  const calcTotal = f => Number(f.performance_fee||0)+Number(f.travel_expense||0)+Number(f.accommodation_expense||0)+Number(f.other_expenses||0)

  const handleAdd = async (e) => { e.preventDefault(); setSaving(true); try { await artistExpenseAPI.create(form); toast.success('Expense added'); setShowAdd(false); setForm(emptyExp); fetchAll() } catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setSaving(false) } }
  const handleEdit = async (e) => { e.preventDefault(); setSaving(true); try { await artistExpenseAPI.update(editItem.id, editItem); toast.success('Updated'); setEditItem(null); fetchAll() } catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setSaving(false) } }

  const ExpenseForm = ({f,setF,onSub,onCan,isNew}) => (
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
        <button type="submit" disabled={saving} className="btn-primary">{saving&&<Loader className="w-4 h-4 animate-spin"/>} {isNew?'Add':'Save Changes'}</button>
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
                <td className="td text-gray-500 text-xs max-w-[100px] truncate">{e.remarks||'—'}</td>
                <td className="td"><IconBtn onClick={()=>setEditItem({...e})}><Edit className="w-4 h-4"/></IconBtn></td>
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
    </div>
  )
}
