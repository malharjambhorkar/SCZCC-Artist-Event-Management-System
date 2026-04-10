const router = require('express').Router()
const auth   = require('../controllers/authController')
const artist = require('../controllers/artistController')
const mc     = require('../controllers/mainController')
const { authenticate, authorize } = require('../middleware/auth')

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/login',           auth.login)
router.get ('/auth/me',              authenticate, auth.getMe)
router.post('/auth/change-password', authenticate, auth.changePassword)

// ── Artists ───────────────────────────────────────────────────
router.get ('/artists/stats',        authenticate, authorize('admin','clerk'), artist.getStats)
router.get ('/artists/export/excel', authenticate, authorize('admin','clerk'), artist.exportExcel)
router.get ('/artists',              authenticate, authorize('admin','clerk'), artist.getArtists)
router.get ('/artists/:id',          authenticate, artist.getArtistById)
router.post('/artists',              authenticate, authorize('admin'), artist.createArtist)
router.put ('/artists/:id',          authenticate, artist.updateArtist)
router.delete('/artists/:id',        authenticate, authorize('admin'), artist.deleteArtist)
router.patch('/artists/:id/toggle-status', authenticate, authorize('admin','clerk'), artist.toggleStatus)

// ── Artist Expenses ───────────────────────────────────────────
router.get   ('/artist-expenses',      authenticate, authorize('admin','clerk'), artist.getArtistExpenses)
router.post  ('/artist-expenses',      authenticate, authorize('admin','clerk'), artist.createArtistExpense)
router.put   ('/artist-expenses/:id',  authenticate, authorize('admin','clerk'), artist.updateArtistExpense)
router.delete('/artist-expenses/:id',  authenticate, authorize('admin'), artist.deleteArtistExpense)

// ── Events ────────────────────────────────────────────────────
router.get ('/events/stats',           authenticate, authorize('admin','clerk'), mc.getEventStats)
router.get ('/events/export/excel',    authenticate, authorize('admin','clerk'), mc.exportEventsExcel)
router.get ('/events/artist/:artistId',authenticate, mc.getArtistEvents)
router.get ('/events',                 authenticate, mc.getEvents)
router.get ('/events/:id',             authenticate, mc.getEventById)
router.post('/events',                 authenticate, authorize('admin','clerk'), mc.createEvent)
router.put ('/events/:id',             authenticate, authorize('admin','clerk'), mc.updateEvent)
router.delete('/events/:id',           authenticate, authorize('admin'), mc.deleteEvent)

// ── Venues ────────────────────────────────────────────────────
router.get ('/venues/stats',         authenticate, authorize('admin','clerk'), mc.getVenueStats)
router.get ('/venues/export/excel',  authenticate, authorize('admin'), mc.exportVenuesExcel)
router.get ('/venues',               authenticate, mc.getVenues)
router.post('/venues',               authenticate, authorize('admin'), mc.createVenue)
router.put ('/venues/:id',           authenticate, authorize('admin'), mc.updateVenue)
router.delete('/venues/:id',         authenticate, authorize('admin'), mc.deleteVenue)

// ── Expenses (Budget) ─────────────────────────────────────────
router.get ('/expenses/summary',     authenticate, authorize('admin','clerk'), mc.getExpenseSummary)
router.get ('/expenses/export/excel',authenticate, authorize('admin','clerk'), mc.exportExpensesExcel)
router.get ('/expenses',             authenticate, authorize('admin','clerk'), mc.getExpenses)
router.post('/expenses',             authenticate, authorize('admin','clerk'), mc.createExpense)
router.put ('/expenses/:id',         authenticate, authorize('admin','clerk'), mc.updateExpense)

// ── Reports ───────────────────────────────────────────────────
router.get('/reports/dashboard', authenticate, authorize('admin','clerk'), mc.getDashboard)
router.get('/reports/annual',    authenticate, authorize('admin','clerk'), mc.getAnnualReport)

module.exports = router
