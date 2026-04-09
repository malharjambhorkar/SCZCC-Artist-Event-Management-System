const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query } = require('../config/db')

const sign = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET || 'secret',
  { expiresIn: '7d' }
)

exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body
    if (!email || !password || !role)
      return res.status(400).json({ success: false, message: 'Email, password and role are required' })

    const { rows } = await query('SELECT * FROM users WHERE email=$1', [email])
    const user = rows[0]
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    if (user.role !== role) return res.status(401).json({ success: false, message: `This account is not registered as ${role}` })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    let profile = null
    if (role === 'artist') {
      const { rows: ar } = await query('SELECT * FROM artists WHERE email=$1', [email])
      profile = ar[0] || null
    }

    res.json({ success: true, data: { token: sign(user), user: { id: user.id, email: user.email, role: user.role, name: user.name }, profile } })
  } catch (err) { next(err) }
}

exports.getMe = async (req, res, next) => {
  try {
    let profile = null
    if (req.user.role === 'artist') {
      const { rows } = await query('SELECT * FROM artists WHERE email=$1', [req.user.email])
      profile = rows[0] || null
    }
    res.json({ success: true, data: { user: req.user, profile } })
  } catch (err) { next(err) }
}

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const { rows } = await query('SELECT * FROM users WHERE id=$1', [req.user.id])
    const ok = await bcrypt.compare(currentPassword, rows[0].password)
    if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    const hashed = await bcrypt.hash(newPassword, 10)
    await query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hashed, req.user.id])
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (err) { next(err) }
}
