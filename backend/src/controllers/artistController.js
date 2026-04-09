const bcrypt = require('bcryptjs')
const { query, getClient } = require('../config/db')
const ExcelJS = require('exceljs')

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
    const { full_name, email, phone, art_form, location, state, years_of_experience, biography, password = 'Password@123' } = req.body
    const exists = await client.query('SELECT id FROM users WHERE email=$1', [email])
    if (exists.rows[0]) { await client.query('ROLLBACK'); return res.status(409).json({ success: false, message: 'Email already exists' }) }
    const hashed = await bcrypt.hash(password, 10)
    const ur = await client.query(`INSERT INTO users (email,password,role,name) VALUES ($1,$2,'artist',$3) RETURNING id`, [email, hashed, full_name])
    const ar = await client.query(
      `INSERT INTO artists (user_id,full_name,email,phone,art_form,location,state,years_of_experience,biography) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [ur.rows[0].id, full_name, email, phone, art_form, location, state || location, Number(years_of_experience) || 0, biography || '']
    )
    await client.query('COMMIT')
    res.status(201).json({ success: true, message: 'Artist created', data: ar.rows[0] })
  } catch (err) { await client.query('ROLLBACK'); next(err) }
  finally { client.release() }
}

exports.updateArtist = async (req, res, next) => {
  try {
    const { id } = req.params
    if (req.user.role === 'artist') {
      const { rows } = await query('SELECT id FROM artists WHERE email=$1', [req.user.email])
      if (!rows[0] || rows[0].id !== id) return res.status(403).json({ success: false, message: 'Can only update own profile' })
    }
    const allowedFields = req.user.role === 'admin'
      ? ['full_name','phone','art_form','location','state','years_of_experience','biography','status','email']
      : ['full_name','phone','art_form','location','state','years_of_experience','biography']
    const updates = [], params = []
    let p = 1
    allowedFields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=$${p}`); params.push(req.body[f]); p++ } })
    if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update' })
    updates.push(`updated_at=NOW()`)
    params.push(id)
    const { rows } = await query(`UPDATE artists SET ${updates.join(',')} WHERE id=$${p} RETURNING *`, params)
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Artist not found' })
    if (req.body.full_name) await query('UPDATE users SET name=$1, updated_at=NOW() WHERE email=$2', [req.body.full_name, rows[0].email])
    res.json({ success: true, message: 'Artist updated', data: rows[0] })
  } catch (err) { next(err) }
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
