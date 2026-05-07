const bcrypt = require('bcryptjs')
const { query, getClient } = require('../config/db')
const ExcelJS = require('exceljs')
const { trimOrNull } = require('../utils/validation')
const { ensureRecordExists } = require('../utils/dbChecks')
const { parseExpenseAmount } = require('../utils/expense')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AADHAAR_RE = /^\d{12}$/

const parseNonNegativeInt = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null
}

function validateArtistPayload(payload, { isCreate = false, allowEmail = false } = {}) {
  const normalized = {}
  const requiredTextFields = isCreate ? ['full_name', 'email', 'phone', 'art_form', 'location', 'state'] : []

  for (const field of requiredTextFields) {
    if (!trimOrNull(payload[field])) return { error: `${field.replace(/_/g, ' ')} is required` }
  }

  const textFields = [
    'full_name', 'email', 'phone', 'art_form', 'art_form_other', 'location', 'state', 'biography',
    'educational_qualification', 'educational_qualification_other',
    'artistic_qualification', 'artistic_qualification_other',
    'caste', 'caste_other', 'aadhaar_number', 'profile_photo', 'status'
  ]

  textFields.forEach((field) => {
    if (payload[field] !== undefined) normalized[field] = trimOrNull(payload[field])
  })

  if (normalized.email && !allowEmail) delete normalized.email
  if (normalized.email && !EMAIL_RE.test(normalized.email)) return { error: 'Please provide a valid email address' }
  if (normalized.aadhaar_number && !AADHAAR_RE.test(normalized.aadhaar_number)) return { error: 'Aadhaar number must be exactly 12 digits' }
  if (normalized.status && !['active', 'inactive'].includes(normalized.status)) return { error: 'Invalid artist status' }

  if (payload.years_of_experience !== undefined) {
    normalized.years_of_experience = parseNonNegativeInt(payload.years_of_experience)
    if (normalized.years_of_experience === null) return { error: 'Years of experience must be a non-negative number' }
  }

  if (isCreate) {
    normalized.biography = normalized.biography || ''
    normalized.state = normalized.state || normalized.location
  }

  return { normalized }
}

exports.getArtists = async (req, res, next) => {
  try {
    const { search, status, art_form, location, page = 1, limit = 100 } = req.query
    const conds = [], params = []
    let p = 1
    if (search)   { conds.push(`(full_name ILIKE $${p} OR art_form ILIKE $${p} OR location ILIKE $${p} OR email ILIKE $${p})`); params.push(`%${search}%`); p++ }
    if (status)   { conds.push(`status=$${p}`);   params.push(status);   p++ }
    if (art_form) { conds.push(`art_form=$${p}`); params.push(art_form); p++ }
    if (location) { conds.push(`location=$${p}`); params.push(location); p++ }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const offset = (Number(page) - 1) * Number(limit)
    const count = await query(`SELECT COUNT(*) FROM artists ${where}`, params)
    const { rows } = await query(`SELECT * FROM artists ${where} ORDER BY full_name LIMIT $${p} OFFSET $${p+1}`, [...params, Number(limit), offset])
    res.json({ success: true, data: rows, pagination: { total: parseInt(count.rows[0].count), page: Number(page), limit: Number(limit) } })
  } catch (err) { next(err) }
}

exports.getArtistById = async (req, res, next) => {
  try {
    if (req.user.role === 'artist') {
      const { rows } = await query('SELECT id FROM artists WHERE email=$1', [req.user.email])
      if (!rows[0] || rows[0].id !== req.params.id)
        return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const { rows } = await query('SELECT * FROM artists WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Artist not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
}

exports.createArtist = async (req, res, next) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const { normalized, error } = validateArtistPayload(req.body, { isCreate: true, allowEmail: true })
    if (error) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: error }) }

    const {
      full_name, email, phone, art_form, art_form_other, location, state,
      years_of_experience = 0, biography = '', educational_qualification,
      educational_qualification_other, artistic_qualification,
      artistic_qualification_other, caste, caste_other, aadhaar_number, profile_photo
    } = normalized
    const password = trimOrNull(req.body.password) || 'Password@123'

    const exists = await client.query('SELECT id FROM users WHERE email=$1', [email])
    if (exists.rows[0]) { await client.query('ROLLBACK'); return res.status(409).json({ success: false, message: 'Email already exists' }) }
    const hashed = await bcrypt.hash(password, 10)
    const ur = await client.query(`INSERT INTO users (email,password,role,name) VALUES ($1,$2,'artist',$3) RETURNING id`, [email, hashed, full_name])
    const ar = await client.query(
      `INSERT INTO artists (
        user_id, full_name, email, phone, art_form, art_form_other, location, state,
        years_of_experience, biography,
        educational_qualification, educational_qualification_other,
        artistic_qualification, artistic_qualification_other,
        caste, caste_other, aadhaar_number, profile_photo
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        ur.rows[0].id, full_name, email, phone, art_form, art_form_other||null,
        location, state||location, years_of_experience, biography,
        educational_qualification||null, educational_qualification_other||null,
        artistic_qualification||null, artistic_qualification_other||null,
        caste||null, caste_other||null, aadhaar_number||null, profile_photo||null
      ]
    )
    await client.query('COMMIT')
    res.status(201).json({ success: true, message: 'Artist created', data: ar.rows[0] })
  } catch (err) { await client.query('ROLLBACK'); next(err) }
  finally { client.release() }
}

exports.updateArtist = async (req, res, next) => {
  const client = await getClient()
  try {
    const { id } = req.params
    if (req.user.role === 'artist') {
      const { rows } = await query('SELECT id FROM artists WHERE email=$1', [req.user.email])
      if (!rows[0] || rows[0].id !== id) return res.status(403).json({ success: false, message: 'Can only update own profile' })
    }
    const adminFields = [
      'full_name','phone','art_form','art_form_other','location','state','years_of_experience','biography','status','email',
      'educational_qualification','educational_qualification_other',
      'artistic_qualification','artistic_qualification_other',
      'caste','caste_other','aadhaar_number','profile_photo'
    ]
    const artistFields = [
      'full_name','phone','art_form','art_form_other','location','state','years_of_experience','biography',
      'educational_qualification','educational_qualification_other',
      'artistic_qualification','artistic_qualification_other',
      'caste','caste_other','aadhaar_number','profile_photo'
    ]
    const allowedFields = req.user.role === 'admin' ? adminFields : artistFields
    const allowEmail = allowedFields.includes('email')
    const { normalized, error } = validateArtistPayload(req.body, { allowEmail })
    if (error) return res.status(400).json({ success: false, message: error })

    await client.query('BEGIN')
    const existing = await client.query('SELECT * FROM artists WHERE id=$1', [id])
    if (!existing.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Artist not found' })
    }

    const current = existing.rows[0]
    const nextEmail = normalized.email || current.email
    if (normalized.email && normalized.email !== current.email) {
      const dupUser = await client.query('SELECT id FROM users WHERE email=$1', [normalized.email])
      if (dupUser.rows[0]) {
        await client.query('ROLLBACK')
        return res.status(409).json({ success: false, message: 'Email already exists' })
      }
    }

    const updates = [], params = []
    let p = 1
    allowedFields.forEach(f => {
      if (normalized[f] !== undefined) {
        updates.push(`${f}=$${p}`)
        params.push(normalized[f])
        p++
      }
    })
    if (!updates.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, message: 'No fields to update' })
    }
    updates.push(`updated_at=NOW()`)
    params.push(id)
    const { rows } = await client.query(`UPDATE artists SET ${updates.join(',')} WHERE id=$${p} RETURNING *`, params)

    if (normalized.full_name || normalized.email) {
      await client.query(
        'UPDATE users SET name=$1, email=$2, updated_at=NOW() WHERE id=$3',
        [rows[0].full_name, nextEmail, current.user_id]
      )
    }

    await client.query('COMMIT')
    res.json({ success: true, message: 'Artist updated', data: rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

exports.deleteArtist = async (req, res, next) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT email FROM artists WHERE id=$1', [req.params.id])
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Artist not found' }) }
    await client.query('DELETE FROM artists WHERE id=$1', [req.params.id])
    await client.query('DELETE FROM users WHERE email=$1', [rows[0].email])
    await client.query('COMMIT')
    res.json({ success: true, message: 'Artist deleted' })
  } catch (err) { await client.query('ROLLBACK'); next(err) }
  finally { client.release() }
}

exports.toggleStatus = async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE artists SET status=CASE WHEN status='active' THEN 'inactive' ELSE 'active' END, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Artist not found' })
    res.json({ success: true, message: `Status set to ${rows[0].status}`, data: rows[0] })
  } catch (err) { next(err) }
}

exports.getStats = async (req, res, next) => {
  try {
    const [t, a, af, tm] = await Promise.all([
      query('SELECT COUNT(*) FROM artists'),
      query("SELECT COUNT(*) FROM artists WHERE status='active'"),
      query('SELECT COUNT(DISTINCT art_form) FROM artists'),
      query("SELECT COUNT(*) FROM artists WHERE created_at >= date_trunc('month',NOW())"),
    ])
    const byAF = await query('SELECT art_form, COUNT(*) c FROM artists GROUP BY art_form ORDER BY c DESC')
    res.json({ success: true, data: { total: parseInt(t.rows[0].count), active: parseInt(a.rows[0].count), inactive: parseInt(t.rows[0].count)-parseInt(a.rows[0].count), artForms: parseInt(af.rows[0].count), addedThisMonth: parseInt(tm.rows[0].count), byArtForm: Object.fromEntries(byAF.rows.map(r=>[r.art_form,parseInt(r.c)])) } })
  } catch (err) { next(err) }
}

exports.exportExcel = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT full_name,email,phone,art_form,location,state,years_of_experience,status,created_at FROM artists ORDER BY full_name')
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Artists')
    ws.columns = [
      { header:'Full Name', key:'full_name', width:25 }, { header:'Email', key:'email', width:30 },
      { header:'Phone', key:'phone', width:18 }, { header:'Art Form', key:'art_form', width:22 },
      { header:'Location', key:'location', width:15 }, { header:'State', key:'state', width:18 },
      { header:'Experience (yrs)', key:'years_of_experience', width:16 }, { header:'Status', key:'status', width:12 },
      { header:'Joined', key:'created_at', width:20 },
    ]
    ws.getRow(1).eachCell(cell => { cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEA580C'}}; cell.font={color:{argb:'FFFFFFFF'},bold:true}; cell.alignment={horizontal:'center'} })
    rows.forEach((r,i) => {
      const row = ws.addRow({...r, years_of_experience:`${r.years_of_experience} years`, created_at:new Date(r.created_at).toLocaleDateString('en-IN')})
      row.eachCell(cell => { cell.fill={type:'pattern',pattern:'solid',fgColor:{argb: i%2===0?'FFFFF7ED':'FFFFFFFF'}} })
    })
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition','attachment; filename=artists.xlsx')
    await wb.xlsx.write(res); res.end()
  } catch (err) { next(err) }
}

// ══════════════════════════════════════
// ARTIST EXPENSES
// ══════════════════════════════════════
exports.getArtistExpenses = async (req, res, next) => {
  try {
    const { artist_id, event_id } = req.query
    const conds = [], params = []
    let p = 1
    if (artist_id) { conds.push(`ae.artist_id=$${p}`); params.push(artist_id); p++ }
    if (event_id)  { conds.push(`ae.event_id=$${p}`);  params.push(event_id);  p++ }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const { rows } = await query(
      `SELECT ae.*,
              (COALESCE(ae.performance_fee, 0) + COALESCE(ae.travel_expense, 0) + COALESCE(ae.accommodation_expense, 0) + COALESCE(ae.other_expenses, 0)) as total_expense,
              a.full_name as artist_name, e.name as event_name
       FROM artist_expenses ae
       LEFT JOIN artists a ON ae.artist_id=a.id
       LEFT JOIN events e ON ae.event_id=e.id
       ${where} ORDER BY ae.created_at DESC`,
      params
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

exports.createArtistExpense = async (req, res, next) => {
  const client = await getClient()
  try {
    const artistId = trimOrNull(req.body.artist_id)
    const eventId = trimOrNull(req.body.event_id)
    const {
      performance_fee=0, travel_expense=0, accommodation_expense=0, other_expenses=0, remarks=''
    } = req.body
    const amounts = [performance_fee, travel_expense, accommodation_expense, other_expenses].map(parseExpenseAmount)
    if (!artistId) return res.status(400).json({ success: false, message: 'Artist is required' })
    if (amounts.some(v => v === null)) return res.status(400).json({ success: false, message: 'Expense amounts must be non-negative numbers' })
    if (!(await ensureRecordExists(client, 'artists', artistId))) return res.status(400).json({ success: false, message: 'Selected artist does not exist' })
    if (!(await ensureRecordExists(client, 'events', eventId))) return res.status(400).json({ success: false, message: 'Selected event does not exist' })
    const total = amounts.reduce((sum, value) => sum + value, 0)
    const { rows } = await client.query(
      `INSERT INTO artist_expenses
        (artist_id, event_id, performance_fee, travel_expense, accommodation_expense, other_expenses, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *,
         (COALESCE(performance_fee, 0) + COALESCE(travel_expense, 0) + COALESCE(accommodation_expense, 0) + COALESCE(other_expenses, 0)) as total_expense`,
      [artistId, eventId||null, amounts[0], amounts[1], amounts[2], amounts[3], trimOrNull(remarks)||'']
    )
    res.status(201).json({ success: true, message: 'Artist expense created', data: rows[0] })
  } catch (err) { next(err) }
  finally { client.release() }
}

exports.updateArtistExpense = async (req, res, next) => {
  const client = await getClient()
  try {
    const { performance_fee=0, travel_expense=0, accommodation_expense=0, other_expenses=0, remarks='' } = req.body
    const amounts = [performance_fee, travel_expense, accommodation_expense, other_expenses].map(parseExpenseAmount)
    if (amounts.some(v => v === null)) return res.status(400).json({ success: false, message: 'Expense amounts must be non-negative numbers' })
    const eventId = trimOrNull(req.body.event_id)
    if (!(await ensureRecordExists(client, 'events', eventId))) return res.status(400).json({ success: false, message: 'Selected event does not exist' })
    const { rows } = await client.query(
      `UPDATE artist_expenses
       SET performance_fee=$1, travel_expense=$2, accommodation_expense=$3, other_expenses=$4,
           remarks=$5, event_id=$6, updated_at=NOW()
       WHERE id=$7
       RETURNING *,
         (COALESCE(performance_fee, 0) + COALESCE(travel_expense, 0) + COALESCE(accommodation_expense, 0) + COALESCE(other_expenses, 0)) as total_expense`,
      [amounts[0], amounts[1], amounts[2], amounts[3], trimOrNull(remarks)||'', eventId||null, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Expense not found' })
    res.json({ success: true, message: 'Artist expense updated', data: rows[0] })
  } catch (err) { next(err) }
  finally { client.release() }
}

exports.deleteArtistExpense = async (req, res, next) => {
  try {
    const { rows } = await query('DELETE FROM artist_expenses WHERE id=$1 RETURNING id', [req.params.id])
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Expense not found' })
    res.json({ success: true, message: 'Artist expense deleted' })
  } catch (err) { next(err) }
}
