import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, Edit, UserCheck, UserX, Filter, Download, Loader, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar, StatCard, Modal, IconBtn } from '../components/common/index.jsx'
import { artistAPI, downloadBlob } from '../utils/api'

const ART_FORMS = ['Traditional Dance','Classical Music','Pottery','Folk Painting','Traditional Theatre','Weaving','Wood Carving','Sculpture','Embroidery','Puppetry','Folk Music']

export default function ClerkPortal() {
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
    <div className="min-h-screen bg-cream">
      <Navbar/>
      <main className="max-w-7xl mx-auto px-6 py-10 page-in">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-dark">Artist Management</h1>
          <p className="text-gray-500 mt-1">View and manage all registered artists</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Artists"          value={stats.total||0}         icon={Users}  color="text-brand-600"/>
          <StatCard label="Active"                 value={stats.active||0}        color="text-brand-500"/>
          <StatCard label="Inactive"               value={stats.inactive||0}      color="text-gray-500"/>
          <StatCard label="Added This Month"       value={`+${stats.addedThisMonth||0}`} color="text-brand-600"/>
        </div>
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="font-display text-xl font-bold text-dark">Artists Directory</h2><p className="text-sm text-gray-500">Search, view and edit artist profiles</p></div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="btn-secondary text-sm py-2 px-3"><Download className="w-4 h-4"/>Excel</button>
              <button onClick={()=>setShowFilters(!showFilters)} className="btn-secondary text-sm py-2 px-3"><Filter className="w-4 h-4"/>Filters</button>
            </div>
          </div>
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input className="input pl-9" placeholder="Search artists..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            {showFilters && <>
              <select className="input w-36" value={statusF} onChange={e=>setStatusF(e.target.value)}>
                <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
              <select className="input w-48" value={artFormF} onChange={e=>setArtFormF(e.target.value)}>
                <option value="">All Art Forms</option>{ART_FORMS.map(a=><option key={a}>{a}</option>)}
              </select>
              {(statusF||artFormF) && <button onClick={()=>{setStatusF('');setArtFormF('')}} className="text-sm text-gray-400 flex items-center gap-1"><X className="w-3 h-3"/>Clear</button>}
            </>}
          </div>
          <div className="overflow-x-auto">
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
        </div>
      </main>

      <Modal open={!!viewItem} onClose={()=>setViewItem(null)} title="Artist Profile">
        {viewItem && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center"><span className="font-display font-bold text-2xl text-brand-600">{viewItem.full_name?.[0]}</span></div>
              <div><h3 className="font-display font-bold text-xl">{viewItem.full_name}</h3><p className="text-sm text-gray-500">{viewItem.art_form}</p></div>
              <span className={`ml-auto ${viewItem.status==='active'?'badge-active':'badge-inactive'}`}>{viewItem.status}</span>
            </div>
            {[['Email',viewItem.email],['Phone',viewItem.phone],['Location',viewItem.location],['State',viewItem.state],['Experience',`${viewItem.years_of_experience} years`]].map(([k,v])=>(
              <div key={k} className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-semibold">{v||'—'}</span></div>
            ))}
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
