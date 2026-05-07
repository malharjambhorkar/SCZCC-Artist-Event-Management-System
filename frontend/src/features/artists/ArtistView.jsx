import { Download } from 'lucide-react'
import { printArtistPDF } from './printArtistPDF.js'

export default function ArtistView({ artist }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
        {artist.profile_photo
          ? <img src={artist.profile_photo} alt={artist.full_name} className="w-16 h-20 object-cover rounded-xl border border-gray-200" />
          : <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center"><span className="font-display font-bold text-2xl text-brand-600">{artist.full_name?.[0]}</span></div>}
        <div>
          <h3 className="font-display font-bold text-xl">{artist.full_name}</h3>
          <p className="text-sm text-gray-500">{artist.art_form}{artist.art_form_other ? ` - ${artist.art_form_other}` : ''}</p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          <span className={artist.status === 'active' ? 'badge-active' : 'badge-inactive'}>{artist.status}</span>
          <button onClick={() => printArtistPDF(artist)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            <Download className="w-3 h-3" /> PDF Proof
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6">
        {[
          ['Email', artist.email],
          ['Phone', artist.phone],
          ['Location', artist.location],
          ['State', artist.state],
          ['Experience', `${artist.years_of_experience} years`],
          ['Aadhaar', artist.aadhaar_number ? `XXXX-XXXX-${artist.aadhaar_number.slice(-4)}` : '-'],
          ['Educational Qual.', artist.educational_qualification ? `${artist.educational_qualification}${artist.educational_qualification_other ? ` (${artist.educational_qualification_other})` : ''}` : '-'],
          ['Artistic Qual.', artist.artistic_qualification ? `${artist.artistic_qualification}${artist.artistic_qualification_other ? ` (${artist.artistic_qualification_other})` : ''}` : '-'],
          ['Caste', artist.caste ? `${artist.caste}${artist.caste_other ? ` (${artist.caste_other})` : ''}` : '-'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-right max-w-[55%]">{value || '-'}</span>
          </div>
        ))}
      </div>
      {artist.biography && <div><p className="text-sm text-gray-500 mb-1">Biography</p><p className="text-sm bg-gray-50 rounded-xl p-3">{artist.biography}</p></div>}
    </div>
  )
}
