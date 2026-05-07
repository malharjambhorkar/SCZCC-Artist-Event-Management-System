export default function IconBtn({ onClick, children, danger, success, title }) {
  const cls = danger
    ? 'hover:bg-red-50 text-gray-300 hover:text-red-500'
    : success
      ? 'hover:bg-green-50 text-gray-300 hover:text-green-500'
      : 'hover:bg-brand-50 text-gray-400 hover:text-brand-600'

  return <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-colors ${cls}`}>{children}</button>
}
