const trimOrNull = (value) => {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed || null
}

const parseNonNegativeNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

const parsePositiveInt = (value) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const asStringArray = (value) => {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return null
  return value.map(v => trimOrNull(v)).filter(Boolean)
}

module.exports = {
  trimOrNull,
  parseNonNegativeNumber,
  parsePositiveInt,
  asStringArray,
}
