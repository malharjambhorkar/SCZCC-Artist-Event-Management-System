export default function OtherSelect({ label, options, value, otherValue, onChange, onOtherChange, required }) {
  return (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <select className="input" value={value || ''} onChange={e => onChange(e.target.value)} required={required}>
        <option value="">Select</option>
        {options.map(option => <option key={option}>{option}</option>)}
      </select>
      {value === 'Other' && (
        <input className="input mt-2" placeholder="Please specify..." value={otherValue || ''} onChange={e => onOtherChange(e.target.value)} required />
      )}
    </div>
  )
}
