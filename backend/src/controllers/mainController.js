const { query } = require('../config/db')
const ExcelJS = require('exceljs')

// ══════════════════════════════════════
// EVENT CONTROLLER
// ══════════════════════════════════════
exports.getEvents = async (req, res, next) => {
  try {
    const { search, status, art_form } = req.query
    const conds = [], params = []
    let p = 1
    if (search)   { conds.push(`(e.name ILIKE $${p} OR e.venue_name ILIKE $${p} OR e.art_form ILIKE $${p})`); params.push(`%${search}%`); p++ }
    if (status)   { conds.push(`e.status=$${p}`);   params.push(status);   p++ }
    if (art_form) { conds.push(`e.art_form=$${p}`); params.push(art_form); p++ }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : ''
    const { rows } = await query(
      `SELECT e.*,
         COALESCE(json_agg(json_build_object('id',a.id,'full_name',a.full_name,'art_form',a.art_form)) FILTER (WHERE a.id IS NOT NULL),'[]') as artists
       FROM events e
       LEFT JOIN event_artists ea ON e.id=ea.event_id
       LEFT JOIN artists a ON ea.artist_id=a.id
       ${where} GROUP BY e.id ORDER BY e.date DESC`, params
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

exports.getEventById = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.*,
         COALESCE(json_agg(json_build_object('id',a.id,'full_name',a.full_name)) FILTER (WHERE a.id IS NOT NULL),'[]') as artists
       FROM events e
       LEFT JOIN event_artists ea ON e.id=ea.event_id
       LEFT JOIN artists a ON ea.artist_id=a.id
       WHERE e.id=$1 GROUP BY e.id`, [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Event not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
}

exports.getArtistEvents = async (req, res, next) => {
  try {
    const { artistId } = req.params
    if (req.user.role === 'artist') {
      const { rows } = await query('SELECT id FROM artists WHERE email=$1', [req.user.email])
      if (!rows[0] || rows[0].id !== artistId) return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const { rows } = await query(
      `SELECT e.* FROM events e JOIN event_artists ea ON e.id=ea.event_id WHERE ea.artist_id=$1 ORDER BY e.date DESC`, [artistId]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

exports.createEvent = async (req, res, next) => {
  try {
    const { name, date, venue_id, art_form, participants_max, status='upcoming', description='', assigned_artists=[] } = req.body
    let venue_name = ''
    if (venue_id) {
      const vr = await query('SELECT name FROM venues WHERE id=$1', [venue_id])
      venue_name = vr.rows[0]?.name || ''
    }
    const { rows } = await query(
      `INSERT INTO events (name,date,venue_id,venue_name,art_form,participants_max,status,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, date, venue_id||null, venue_name, art_form, Number(participants_max), status, description]
    )
    const ev = rows[0]
    for (const aid of assigned_artists)
      await query('INSERT INTO event_artists (event_id,artist_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [ev.id, aid])
    if (venue_id) await query('UPDATE venues SET total_events=total_events+1 WHERE id=$1', [venue_id])
    res.status(201).json({ success: true, message: 'Event created', data: ev })
  } catch (err) { next(err) }
}

exports.updateEvent = async (req, res, next) => {
  try {
    const fields = ['name','date','venue_id','art_form','participants_current','participants_max','status','description']
    const updates = [], params = []
    let p = 1
    if (req.body.venue_id) {
      const vr = await query('SELECT name FROM venues WHERE id=$1', [req.body.venue_id])
      if (vr.rows[0]) { updates.push(`venue_name=$${p}`); params.push(vr.rows[0].name); p++ }
    }
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=$${p}`); params.push(req.body[f]); p++ } })
    if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update' })
    updates.push('updated_at=NOW()'); params.push(req.params.id)
    const { rows } = await query(`UPDATE events SET ${updates.join(',')} WHERE id=$${p} RETURNING *`, params)
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Event not found' })
    res.json({ success: true, message: 'Event updated', data: rows[0] })
  } catch (err) { next(err) }
}

exports.deleteEvent = async (req, res, next) => {
  try {
    const { rows } = await query('DELETE FROM events WHERE id=$1 RETURNING id', [req.params.id])
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Event not found' })
    res.json({ success: true, message: 'Event deleted' })
  } catch (err) { next(err) }
}

exports.getEventStats = async (req, res, next) => {
  try {
    const [t,u,c,tm] = await Promise.all([
      query('SELECT COUNT(*) FROM events'),
      query("SELECT COUNT(*) FROM events WHERE status='upcoming'"),
      query("SELECT COUNT(*) FROM events WHERE status='completed'"),
      query("SELECT COUNT(*) FROM events WHERE date>=date_trunc('month',NOW()) AND date<date_trunc('month',NOW())+INTERVAL '1 month'"),
    ])
    res.json({ success:true, data:{ total:parseInt(t.rows[0].count), upcoming:parseInt(u.rows[0].count), completed:parseInt(c.rows[0].count), thisMonth:parseInt(tm.rows[0].count) }})
  } catch (err) { next(err) }
}

exports.exportEventsExcel = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT name,date,venue_name,art_form,participants_current,participants_max,status,description FROM events ORDER BY date DESC')
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Events')
    ws.columns = [
      {header:'Event Name',key:'name',width:30},{header:'Date',key:'date',width:14},
      {header:'Venue',key:'venue_name',width:22},{header:'Art Form',key:'art_form',width:22},
      {header:'Participants',key:'p',width:14},{header:'Status',key:'status',width:12},
    ]
    ws.getRow(1).eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEA580C'}};c.font={color:{argb:'FFFFFFFF'},bold:true}})
    rows.forEach(r=>ws.addRow({...r,date:new Date(r.date).toLocaleDateString('en-IN'),p:`${r.participants_current}/${r.participants_max}`}))
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition','attachment; filename=events.xlsx')
    await wb.xlsx.write(res); res.end()
  } catch (err) { next(err) }
}

// ══════════════════════════════════════
// VENUE CONTROLLER
// ══════════════════════════════════════
exports.getVenues = async (req, res, next) => {
  try {
    const { search, status, area_type } = req.query
    const conds=[], params=[]
    let p=1
    if (search)    { conds.push(`(name ILIKE $${p} OR city ILIKE $${p} OR state ILIKE $${p})`); params.push(`%${search}%`); p++ }
    if (status)    { conds.push(`status=$${p}`);    params.push(status);    p++ }
    if (area_type) { conds.push(`area_type=$${p}`); params.push(area_type); p++ }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : ''
    const { rows } = await query(`SELECT * FROM venues ${where} ORDER BY name`, params)
    res.json({ success:true, data:rows })
  } catch (err) { next(err) }
}

exports.createVenue = async (req, res, next) => {
  try {
    const { name, state, city, area_type='Urban', capacity } = req.body
    const { rows } = await query(
      `INSERT INTO venues (name,state,city,area_type,capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, state, city, area_type, Number(capacity)]
    )
    res.status(201).json({ success:true, message:'Venue created', data:rows[0] })
  } catch (err) { next(err) }
}

exports.updateVenue = async (req, res, next) => {
  try {
    const fields = ['name','state','city','area_type','capacity','status']
    const updates=[], params=[]
    let p=1
    fields.forEach(f=>{ if(req.body[f]!==undefined){ updates.push(`${f}=$${p}`); params.push(req.body[f]); p++ }})
    if (!updates.length) return res.status(400).json({ success:false, message:'Nothing to update' })
    updates.push('updated_at=NOW()'); params.push(req.params.id)
    const { rows } = await query(`UPDATE venues SET ${updates.join(',')} WHERE id=$${p} RETURNING *`, params)
    if (!rows[0]) return res.status(404).json({ success:false, message:'Venue not found' })
    res.json({ success:true, message:'Venue updated', data:rows[0] })
  } catch (err) { next(err) }
}

exports.deleteVenue = async (req, res, next) => {
  try {
    const { rows:up } = await query("SELECT id FROM events WHERE venue_id=$1 AND status='upcoming'", [req.params.id])
    if (up.length) return res.status(400).json({ success:false, message:'Cannot delete venue with upcoming events' })
    const { rows } = await query('DELETE FROM venues WHERE id=$1 RETURNING id', [req.params.id])
    if (!rows[0]) return res.status(404).json({ success:false, message:'Venue not found' })
    res.json({ success:true, message:'Venue deleted' })
  } catch (err) { next(err) }
}

exports.getVenueStats = async (req, res, next) => {
  try {
    const [t,a] = await Promise.all([query('SELECT COUNT(*) FROM venues'),query("SELECT COUNT(*) FROM venues WHERE status='active'")])
    const byType = await query('SELECT area_type, COUNT(*) c FROM venues GROUP BY area_type')
    res.json({ success:true, data:{ total:parseInt(t.rows[0].count), active:parseInt(a.rows[0].count), byAreaType:Object.fromEntries(byType.rows.map(r=>[r.area_type,parseInt(r.c)])) }})
  } catch (err) { next(err) }
}

exports.exportVenuesExcel = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT name,state,city,area_type,capacity,total_events,status FROM venues ORDER BY name')
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Venues')
    ws.columns=[{header:'Name',key:'name',width:25},{header:'State',key:'state',width:18},{header:'City',key:'city',width:15},{header:'Area Type',key:'area_type',width:12},{header:'Capacity',key:'capacity',width:12},{header:'Total Events',key:'total_events',width:14},{header:'Status',key:'status',width:12}]
    ws.getRow(1).eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEA580C'}};c.font={color:{argb:'FFFFFFFF'},bold:true}})
    rows.forEach(r=>ws.addRow(r))
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition','attachment; filename=venues.xlsx')
    await wb.xlsx.write(res); res.end()
  } catch (err) { next(err) }
}

// ══════════════════════════════════════
// EXPENSE CONTROLLER
// ══════════════════════════════════════
exports.getExpenseSummary = async (req, res, next) => {
  try {
    const { fy='2024-25' } = req.query
    const [sy] = fy.split('-').map(Number)
    const { rows } = await query(
      `SELECT * FROM expenses WHERE (month=ANY($1) AND year=$2) OR (month=ANY($3) AND year=$4)
       ORDER BY year, array_position(ARRAY['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],month)`,
      [['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],sy,['Jan','Feb','Mar'],sy+1]
    )
    const total = rows.reduce((s,r)=>s+Number(r.amount),0)
    const avgMonthly = rows.length ? Math.round(total/rows.length) : 0
    const highest = rows.reduce((a,b)=>Number(a.amount)>Number(b.amount)?a:b, rows[0]||{})
    const lowest  = rows.reduce((a,b)=>Number(a.amount)<Number(b.amount)?a:b, rows[0]||{})
    const ct = {venue:0,equipment:0,travel:0,marketing:0,miscellaneous:0}
    rows.forEach(r=>{ ct.venue+=Number(r.venue||0); ct.equipment+=Number(r.equipment||0); ct.travel+=Number(r.travel||0); ct.marketing+=Number(r.marketing||0); ct.miscellaneous+=Number(r.miscellaneous||0) })
    res.json({ success:true, data:{
      fy, total, avgMonthly,
      highest: highest?.id ? {amount:Number(highest.amount),period:`${highest.month} ${highest.year}`} : null,
      lowest:  lowest?.id  ? {amount:Number(lowest.amount), period:`${lowest.month} ${lowest.year}`}  : null,
      monthly: rows.map(r=>({month:r.month,year:r.year,amount:Number(r.amount),categories:{venue:Number(r.venue),equipment:Number(r.equipment),travel:Number(r.travel),marketing:Number(r.marketing),miscellaneous:Number(r.miscellaneous)}})),
      categoryTotals: ct,
    }})
  } catch (err) { next(err) }
}

exports.getExpenses = async (req, res, next) => {
  try {
    const { fy='2024-25' } = req.query
    const [sy] = fy.split('-').map(Number)
    const { rows } = await query(
      `SELECT * FROM expenses WHERE (month=ANY($1) AND year=$2) OR (month=ANY($3) AND year=$4) ORDER BY year, array_position(ARRAY['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],month)`,
      [['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],sy,['Jan','Feb','Mar'],sy+1]
    )
    res.json({ success:true, data:rows })
  } catch (err) { next(err) }
}

exports.createExpense = async (req, res, next) => {
  try {
    const { month, year, amount, venue=0, equipment=0, travel=0, marketing=0, miscellaneous=0, event_id } = req.body
    const { rows } = await query(
      `INSERT INTO expenses (month,year,amount,venue,equipment,travel,marketing,miscellaneous,event_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [month, Number(year), Number(amount), Number(venue), Number(equipment), Number(travel), Number(marketing), Number(miscellaneous), event_id||null]
    )
    res.status(201).json({ success:true, message:'Expense created', data:rows[0] })
  } catch (err) {
    if (err.code==='23505') return res.status(409).json({ success:false, message:`Expense for ${req.body.month} ${req.body.year} already exists. Use edit instead.` })
    next(err)
  }
}

exports.updateExpense = async (req, res, next) => {
  try {
    const { amount, venue=0, equipment=0, travel=0, marketing=0, miscellaneous=0, event_id } = req.body
    const { rows } = await query(
      `UPDATE expenses SET amount=$1,venue=$2,equipment=$3,travel=$4,marketing=$5,miscellaneous=$6,event_id=$7 WHERE id=$8 RETURNING *`,
      [Number(amount),Number(venue),Number(equipment),Number(travel),Number(marketing),Number(miscellaneous),event_id||null,req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ success:false, message:'Expense not found' })
    res.json({ success:true, message:'Expense updated', data:rows[0] })
  } catch (err) { next(err) }
}

exports.exportExpensesExcel = async (req, res, next) => {
  try {
    const { fy='2024-25' } = req.query
    const [sy] = fy.split('-').map(Number)
    const { rows } = await query(
      `SELECT month,year,amount,venue,equipment,travel,marketing,miscellaneous FROM expenses
       WHERE (month=ANY($1) AND year=$2) OR (month=ANY($3) AND year=$4)
       ORDER BY year, array_position(ARRAY['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],month)`,
      [['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],sy,['Jan','Feb','Mar'],sy+1]
    )
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet(`Expenses FY ${fy}`)
    ws.columns=[{header:'Month',key:'month',width:10},{header:'Year',key:'year',width:8},{header:'Total (₹)',key:'amount',width:15},{header:'Venue (₹)',key:'venue',width:14},{header:'Equipment (₹)',key:'equipment',width:15},{header:'Travel (₹)',key:'travel',width:14},{header:'Marketing (₹)',key:'marketing',width:15},{header:'Misc (₹)',key:'miscellaneous',width:14}]
    ws.getRow(1).eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEA580C'}};c.font={color:{argb:'FFFFFFFF'},bold:true}})
    rows.forEach(r=>ws.addRow(r))
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition',`attachment; filename=expenses-${fy}.xlsx`)
    await wb.xlsx.write(res); res.end()
  } catch (err) { next(err) }
}

// ══════════════════════════════════════
// REPORT CONTROLLER
// ══════════════════════════════════════
exports.getDashboard = async (req, res, next) => {
  try {
    const [a,e,v,em] = await Promise.all([
      query('SELECT COUNT(*) FROM artists'),
      query("SELECT COUNT(*) FROM events WHERE status='upcoming'"),
      query('SELECT COUNT(*) FROM venues'),
      query("SELECT COUNT(*) FROM events WHERE date>=date_trunc('month',NOW()) AND date<date_trunc('month',NOW())+INTERVAL '1 month'"),
    ])
    res.json({ success:true, data:{ totalArtists:parseInt(a.rows[0].count), activeEvents:parseInt(e.rows[0].count), totalVenues:parseInt(v.rows[0].count), eventsThisMonth:parseInt(em.rows[0].count) }})
  } catch (err) { next(err) }
}

exports.getAnnualReport = async (req, res, next) => {
  try {
    const { fy='2024-25' } = req.query
    const [sy] = fy.split('-').map(Number)
    const [a,e,v,exp] = await Promise.all([
      query('SELECT COUNT(*) FROM artists'),
      query('SELECT COUNT(*) FROM events'),
      query('SELECT COUNT(*) FROM venues'),
      query(`SELECT COALESCE(SUM(amount),0) FROM expenses WHERE (month=ANY($1) AND year=$2) OR (month=ANY($3) AND year=$4)`,
        [['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],sy,['Jan','Feb','Mar'],sy+1])
    ])
    const afBreakdown = await query('SELECT art_form, COUNT(*) c FROM artists GROUP BY art_form')
    const artistSummary = await query(`SELECT a.id,a.full_name,a.art_form,a.location,a.years_of_experience,a.status, COUNT(ea.event_id) as events_count FROM artists a LEFT JOIN event_artists ea ON a.id=ea.artist_id GROUP BY a.id ORDER BY a.full_name`)
    const monthly = await query(`SELECT TO_CHAR(date,'Mon') m, COUNT(*) c FROM events GROUP BY TO_CHAR(date,'Mon')`)
    res.json({ success:true, data:{
      fy,
      summary:{ totalArtists:parseInt(a.rows[0].count), totalEvents:parseInt(e.rows[0].count), totalVenues:parseInt(v.rows[0].count), totalExpenses:parseFloat(exp.rows[0].coalesce), growthFromLastFY:{artists:'+12%',events:'+8%',venues:'+5%',expenses:'+15%'} },
      monthlyActivity: monthly.rows.map(r=>({month:r.m,events:parseInt(r.c)})),
      artFormBreakdown: Object.fromEntries(afBreakdown.rows.map(r=>[r.art_form,parseInt(r.c)])),
      artistSummary: artistSummary.rows,
    }})
  } catch (err) { next(err) }
}
