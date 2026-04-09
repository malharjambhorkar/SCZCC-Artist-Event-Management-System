require('dotenv').config()
const { pool } = require('./db')
const bcrypt = require('bcryptjs')

async function initDB() {
  const client = await pool.connect()
  try {
    console.log('Creating tables...')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email      VARCHAR(255) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        role       VARCHAR(20)  NOT NULL CHECK (role IN ('artist','clerk','admin')),
        name       VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS artists (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
        full_name           VARCHAR(255) NOT NULL,
        email               VARCHAR(255) UNIQUE NOT NULL,
        phone               VARCHAR(50),
        art_form            VARCHAR(100) NOT NULL,
        location            VARCHAR(100) NOT NULL,
        state               VARCHAR(100),
        years_of_experience INTEGER DEFAULT 0,
        biography           TEXT,
        status              VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
        created_at          TIMESTAMP DEFAULT NOW(),
        updated_at          TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS venues (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name         VARCHAR(255) NOT NULL,
        state        VARCHAR(100) NOT NULL,
        city         VARCHAR(100) NOT NULL,
        area_type    VARCHAR(50) DEFAULT 'Urban' CHECK (area_type IN ('Urban','Semi-Urban','Rural')),
        capacity     INTEGER NOT NULL DEFAULT 100,
        total_events INTEGER DEFAULT 0,
        status       VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                 VARCHAR(255) NOT NULL,
        date                 DATE NOT NULL,
        venue_id             UUID REFERENCES venues(id) ON DELETE SET NULL,
        venue_name           VARCHAR(255),
        art_form             VARCHAR(100) NOT NULL,
        participants_current INTEGER DEFAULT 0,
        participants_max     INTEGER NOT NULL DEFAULT 100,
        status               VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
        description          TEXT,
        created_at           TIMESTAMP DEFAULT NOW(),
        updated_at           TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_artists (
        event_id  UUID REFERENCES events(id) ON DELETE CASCADE,
        artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
        PRIMARY KEY (event_id, artist_id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        month         VARCHAR(10) NOT NULL,
        year          INTEGER NOT NULL,
        amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
        venue         NUMERIC(12,2) DEFAULT 0,
        equipment     NUMERIC(12,2) DEFAULT 0,
        travel        NUMERIC(12,2) DEFAULT 0,
        marketing     NUMERIC(12,2) DEFAULT 0,
        miscellaneous NUMERIC(12,2) DEFAULT 0,
        event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
        created_at    TIMESTAMP DEFAULT NOW(),
        UNIQUE(month, year)
      );
    `)

    console.log('Tables created.')

    const { rows: existing } = await client.query('SELECT COUNT(*) FROM users')
    if (parseInt(existing[0].count) > 0) {
      console.log('Data already exists, skipping seed.')
      return
    }

    console.log('Seeding data...')
    const adminPw  = await bcrypt.hash('admin123', 10)
    const clerkPw  = await bcrypt.hash('clerk123', 10)
    const artistPw = await bcrypt.hash('password123', 10)

    await client.query(
      `INSERT INTO users (email, password, role, name) VALUES ($1,$2,'admin','Admin User'),($3,$4,'clerk','Clerk User')`,
      [adminPw, 'admin@culturalzone.com', clerkPw, 'clerk@culturalzone.com']
    )
    // fix order
    await client.query('DELETE FROM users')
    await client.query(
      `INSERT INTO users (email, password, role, name) VALUES ($1,$2,'admin','Admin User'),($3,$4,'clerk','Clerk User')`,
      ['admin@culturalzone.com', adminPw, 'clerk@culturalzone.com', clerkPw]
    )

    const artists = [
      { name:'John Doe',       email:'john@example.com',   phone:'+91 98765 43210', art:'Traditional Dance',    loc:'Mumbai',    state:'Maharashtra',   exp:15, bio:'Passionate about preserving traditional dance forms.' },
      { name:'Jane Smith',     email:'jane@example.com',   phone:'+91 87654 32109', art:'Classical Music',      loc:'Delhi',     state:'Delhi',         exp:12, bio:'Hindustani classical vocalist with 12 years of training.' },
      { name:'Mike Johnson',   email:'mike@example.com',   phone:'+91 76543 21098', art:'Pottery',             loc:'Jaipur',    state:'Rajasthan',     exp:20, bio:'Third-generation blue pottery artisan from Jaipur.' },
      { name:'Sarah Williams', email:'sarah@example.com',  phone:'+91 65432 10987', art:'Folk Painting',       loc:'Kolkata',   state:'West Bengal',   exp:8,  bio:'Kalighat and Pattachitra painting specialist.', status:'inactive' },
      { name:'David Brown',    email:'david@example.com',  phone:'+91 54321 09876', art:'Traditional Theatre', loc:'Chennai',   state:'Tamil Nadu',    exp:18, bio:'Kathakali practitioner and cultural ambassador.' },
      { name:'Priya Sharma',   email:'priya@example.com',  phone:'+91 43210 98765', art:'Weaving',             loc:'Lucknow',   state:'Uttar Pradesh', exp:10, bio:'Banarasi silk weaving expert, national awardee.' },
      { name:'Rajesh Kumar',   email:'rajesh@example.com', phone:'+91 32109 87654', art:'Wood Carving',        loc:'Bangalore', state:'Karnataka',     exp:25, bio:'Mysore-style wood carving master craftsman.' },
    ]

    const artistIds = []
    for (const a of artists) {
      const ur = await client.query(
        `INSERT INTO users (email, password, role, name) VALUES ($1,$2,'artist',$3) RETURNING id`,
        [a.email, artistPw, a.name]
      )
      const ar = await client.query(
        `INSERT INTO artists (user_id,full_name,email,phone,art_form,location,state,years_of_experience,biography,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [ur.rows[0].id, a.name, a.email, a.phone, a.art, a.loc, a.state, a.exp, a.bio, a.status || 'active']
      )
      artistIds.push(ar.rows[0].id)
    }

    const vr = await client.query(`
      INSERT INTO venues (name, state, city, area_type, capacity, total_events) VALUES
      ('Cultural Center',     'Maharashtra',  'Mumbai',    'Urban',      200, 12),
      ('Grand Hall',          'Delhi',        'Delhi',     'Urban',      500, 8),
      ('Art Gallery',         'Karnataka',    'Bangalore', 'Urban',      150, 15),
      ('Community Center',    'Tamil Nadu',   'Chennai',   'Urban',      100, 6),
      ('Heritage Auditorium', 'Rajasthan',    'Jaipur',    'Urban',      300, 10),
      ('Folk Village Stage',  'West Bengal',  'Kolkata',   'Rural',      400, 5),
      ('Craft Pavilion',      'Uttar Pradesh','Lucknow',   'Semi-Urban', 250, 9)
      RETURNING id, name
    `)
    const vm = {}
    vr.rows.forEach(v => { vm[v.name] = v.id })

    const er = await client.query(`
      INSERT INTO events (name, date, venue_id, venue_name, art_form, participants_current, participants_max, status, description) VALUES
      ('Traditional Dance Festival','2025-11-15',$1,'Cultural Center', 'Traditional Dance', 45, 100,'upcoming','Annual dance festival showcasing classical and folk dance forms.'),
      ('Classical Music Concert',   '2025-10-28',$2,'Grand Hall',      'Classical Music',  120, 500,'upcoming','An evening of Hindustani and Carnatic classical music.'),
      ('Pottery Exhibition',        '2025-09-10',$3,'Art Gallery',     'Pottery',           80, 150,'completed','Exhibition of traditional pottery from across India.'),
      ('Folk Art Workshop',         '2025-11-05',$4,'Community Center','Folk Painting',     30,  50,'upcoming','Hands-on workshop for folk painting techniques.')
      RETURNING id`,
      [vm['Cultural Center'], vm['Grand Hall'], vm['Art Gallery'], vm['Community Center']]
    )

    // Link artists to events
    await client.query('INSERT INTO event_artists VALUES ($1,$2) ON CONFLICT DO NOTHING', [er.rows[0].id, artistIds[0]])
    await client.query('INSERT INTO event_artists VALUES ($1,$2) ON CONFLICT DO NOTHING', [er.rows[1].id, artistIds[1]])
    await client.query('INSERT INTO event_artists VALUES ($1,$2) ON CONFLICT DO NOTHING', [er.rows[2].id, artistIds[2]])
    await client.query('INSERT INTO event_artists VALUES ($1,$2) ON CONFLICT DO NOTHING', [er.rows[3].id, artistIds[3]])

    const expData = [
      ['Apr',2024,243000,80000,50000,40000,43000,30000],
      ['May',2024,267000,90000,55000,42000,50000,30000],
      ['Jun',2024,289000,95000,60000,45000,55000,34000],
      ['Jul',2024,275000,88000,58000,44000,52000,33000],
      ['Aug',2024,290000,92000,62000,46000,56000,34000],
      ['Sep',2024,310000,100000,65000,50000,60000,35000],
      ['Oct',2024,285000,90000,60000,45000,58000,32000],
      ['Nov',2024,295000,95000,62000,47000,58000,33000],
      ['Dec',2024,333000,110000,70000,55000,65000,33000],
      ['Jan',2025,298000,98000,63000,48000,58000,31000],
      ['Feb',2025,279000,90000,59000,45000,55000,30000],
      ['Mar',2025,292500,95000,61000,47000,57000,32500],
    ]
    for (const [m,y,a,v,e,t,mk,misc] of expData) {
      await client.query(
        `INSERT INTO expenses (month,year,amount,venue,equipment,travel,marketing,miscellaneous) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [m,y,a,v,e,t,mk,misc]
      )
    }

    console.log('Seed complete!')
    console.log('Admin: admin@culturalzone.com / admin123')
    console.log('Clerk: clerk@culturalzone.com / clerk123')
    console.log('Artist: john@example.com / password123')
  } catch (err) {
    console.error('Init error:', err.message)
    throw err
  } finally {
    client.release()
  }
}

initDB().then(() => { console.log('DB ready!'); process.exit(0) }).catch(() => process.exit(1))
