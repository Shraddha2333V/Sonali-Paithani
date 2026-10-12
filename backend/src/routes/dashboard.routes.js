const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function formatSaree(row) {
  if (!row) return null;
  return {
    ...row,
    image: row.image || `assets/products/${row.id}.jpg`,
    occasion: typeof row.occasion === 'string' ? JSON.parse(row.occasion) : row.occasion,
    swatch: typeof row.swatch === 'string' ? JSON.parse(row.swatch) : row.swatch
  };
}

// GET /api/dashboard/stats - Employee Dashboard metrics
router.get('/stats', authenticateToken, requireRole('employee', 'admin'), (req, res) => {
  try {
    const totalSarees = db.prepare('SELECT COUNT(*) as count FROM sarees').get().count;
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const pendingBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get().count;

    const avgRow = db.prepare('SELECT AVG(price) as avg_price FROM sarees').get();
    const averagePrice = avgRow.avg_price ? Math.round(avgRow.avg_price) : 0;

    const bestsellers = db.prepare("SELECT * FROM sarees WHERE badge IS NOT NULL AND badge != '' LIMIT 6").all().map(formatSaree);

    const recentBookings = db.prepare('SELECT * FROM bookings ORDER BY id DESC LIMIT 10').all();

    return res.json({
      success: true,
      stats: {
        totalSarees,
        totalBookings,
        pendingBookings,
        averagePrice
      },
      bestsellers,
      recentBookings
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve dashboard metrics.' });
  }
});

module.exports = router;
