import { useNavigate } from 'react-router-dom'
import { Palette, Users, Shield, ArrowRight, Star } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-cream font-body">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-brand-200/40">
        <div className="flex items-center gap-2"><Star className="text-brand-600 w-6 h-6" fill="currentColor"/><span className="font-display font-bold text-lg text-dark">Cultural Art Zone</span></div>
        <button onClick={()=>navigate('/login')} className="btn-primary text-sm">Get Started</button>
      </nav>
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 page-in">
        <h1 className="font-display text-5xl md:text-6xl font-bold text-brand-600 leading-tight max-w-3xl">Preserving Cultural Heritage<br/>Through Digital Innovation</h1>
        <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">A comprehensive platform for managing and celebrating traditional artists, their art forms, and cultural events.</p>
        <button onClick={()=>navigate('/login')} className="mt-10 btn-primary text-base px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          Enter Portal <ArrowRight className="w-4 h-4"/>
        </button>
      </section>
      <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[[Palette,'For Artists','Showcase your traditional art forms and connect with cultural heritage','text-brand-600'],
          [Users,'For Administrators','Efficiently manage artist profiles and cultural documentation','text-brand-500'],
          [Shield,'Secure Platform','Role-based access ensures data integrity and privacy','text-brand-600'],
        ].map(([Icon,title,desc,color],i)=>(
          <div key={i} className="card p-8 flex flex-col items-center text-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-2xl bg-brand-50"><Icon className={`w-10 h-10 ${color}`}/></div>
            <h3 className="font-display font-bold text-xl text-dark">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>
      <footer className="border-t border-brand-200/40 py-6 text-center text-sm text-gray-400">© 2024 Cultural Art Zone — Preserving Heritage Through Digital Innovation</footer>
    </div>
  )
}
