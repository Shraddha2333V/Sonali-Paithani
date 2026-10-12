const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// POST /api/bookings - Submit "Book a Viewing" request
router.post('/', optionalAuth, (req, res) => {
  try {
    const { name, customer_name, phone, customer_phone, email, customer_email, date, preferred_date, saree, saree_name, saree_id, notes } = req.body;

    const finalName = (name || customer_name || '').trim();
    const finalPhone = (phone || customer_phone || '').trim();
    const finalDate = (date || preferred_date || '').trim();
    const finalSaree = (saree || saree_name || '').trim();
    const finalEmail = (email || customer_email || '').trim();

    if (!finalName || !finalPhone || !finalSaree) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, phone number, and saree name are required.'
      });
    }

    const userId = req.user ? req.user.id : null;

    const stmt = db.prepare(`
      INSERT INTO bookings (customer_name, customer_phone, customer_email, saree_id, saree_name, preferred_date, status, user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    const result = stmt.run(
      finalName,
      finalPhone,
      finalEmail || null,
      saree_id || null,
      finalSaree,
      finalDate || null,
      userId,
      notes || null
    );

    const bookingId = Number(result.lastInsertRowid);
    const createdBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

    return res.status(201).json({
      success: true,
      message: 'Viewing request received successfully.',
      booking: createdBooking
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ success: false, error: 'Failed to record viewing request.' });
  }
});

// GET /api/bookings - Employee staff view
router.get('/', authenticateToken, requireRole('employee', 'admin'), (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, u.email as user_email
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.id DESC
    `).all();

    return res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve viewing requests.' });
  }
});

// PATCH /api/bookings/:id/status - Update booking status
router.patch('/:id/status', authenticateToken, requireRole('employee', 'admin'), (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const existing = db.prepare('SELECT id FROM bookings WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    return res.json({
      success: true,
      message: 'Booking status updated.',
      booking: updated
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    return res.status(500).json({ success: false, error: 'Failed to update booking status.' });
  }
});

module.exports = router;
