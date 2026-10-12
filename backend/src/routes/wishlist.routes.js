const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

function formatSaree(row) {
  if (!row) return null;
  return {
    ...row,
    occasion: typeof row.occasion === 'string' ? JSON.parse(row.occasion) : row.occasion,
    swatch: typeof row.swatch === 'string' ? JSON.parse(row.swatch) : row.swatch
  };
}

// GET /api/wishlist - Get current user's wishlist
router.get('/', authenticateToken, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT s.*
      FROM wishlists w
      JOIN sarees s ON w.saree_id = s.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user.id).map(formatSaree);

    const sareeIds = items.map(s => s.id);

    return res.json({
      success: true,
      count: items.length,
      ids: sareeIds,
      items
    });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve wishlist.' });
  }
});

// POST /api/wishlist/:sareeId - Toggle or add to wishlist
router.post('/:sareeId', authenticateToken, (req, res) => {
  try {
    const { sareeId } = req.params;

    const saree = db.prepare('SELECT id FROM sarees WHERE id = ?').get(sareeId);
    if (!saree) {
      return res.status(404).json({ success: false, error: 'Saree not found.' });
    }

    const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ? AND saree_id = ?').get(req.user.id, sareeId);

    if (existing) {
      db.prepare('DELETE FROM wishlists WHERE id = ?').run(existing.id);
      return res.json({
        success: true,
        action: 'removed',
        message: 'Removed from wishlist.',
        sareeId
      });
    } else {
      db.prepare('INSERT INTO wishlists (user_id, saree_id) VALUES (?, ?)').run(req.user.id, sareeId);
      return res.json({
        success: true,
        action: 'added',
        message: 'Saved to wishlist.',
        sareeId
      });
    }
  } catch (err) {
    console.error('Error modifying wishlist:', err);
    return res.status(500).json({ success: false, error: 'Failed to update wishlist.' });
  }
});

// DELETE /api/wishlist/:sareeId - Remove from wishlist
router.delete('/:sareeId', authenticateToken, (req, res) => {
  try {
    const { sareeId } = req.params;
    db.prepare('DELETE FROM wishlists WHERE user_id = ? AND saree_id = ?').run(req.user.id, sareeId);
    return res.json({
      success: true,
      message: 'Removed from wishlist.',
      sareeId
    });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    return res.status(500).json({ success: false, error: 'Failed to remove item from wishlist.' });
  }
});

module.exports = router;
