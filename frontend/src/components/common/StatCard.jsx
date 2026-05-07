export default function StatCard({ label, value, icon: Icon, color = 'text-brand-600', sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={`text-3xl font-display font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && <div className="p-2 rounded-xl bg-brand-50"><Icon className={`w-6 h-6 ${color}`} /></div>}
      </div>
    </div>
  )
}
