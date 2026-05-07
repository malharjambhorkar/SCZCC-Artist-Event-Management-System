async function ensureVenueExists(client, venueId) {
  if (!venueId) return { id: null, name: '' }
  const { rows } = await client.query('SELECT id, name FROM venues WHERE id=$1', [venueId])
  return rows[0] || null
}

async function ensureArtistIdsExist(client, artistIds) {
  if (!artistIds?.length) return true
  const { rows } = await client.query('SELECT id FROM artists WHERE id = ANY($1::uuid[])', [artistIds])
  return rows.length === artistIds.length
}

async function ensureEventExists(client, eventId) {
  if (!eventId) return true
  const { rows } = await client.query('SELECT id FROM events WHERE id=$1', [eventId])
  return Boolean(rows[0])
}

async function ensureRecordExists(client, table, id) {
  if (!id) return true
  const { rows } = await client.query(`SELECT id FROM ${table} WHERE id=$1`, [id])
  return Boolean(rows[0])
}

module.exports = {
  ensureVenueExists,
  ensureArtistIdsExist,
  ensureEventExists,
  ensureRecordExists,
}
