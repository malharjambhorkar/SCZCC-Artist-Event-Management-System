const jwt = require('jsonwebtoken')
const { query } = require('../config/db')

const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' })
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret')
    const { rows } = await query('SELECT id,email,role,name FROM users WHERE id=$1', [decoded.id])
    if (!rows[0]) return res.status(401).json({ success: false, message: 'User not found' })
    req.user = rows[0]
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Access denied' })
  next()
}

module.exports = { authenticate, authorize }
