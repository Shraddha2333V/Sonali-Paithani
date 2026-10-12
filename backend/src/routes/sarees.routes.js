const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

function formatSaree(row) {
  if (!row) return null;
  return {
    ...row,
    occasion: typeof row.occasion === 'string' ? JSON.parse(row.occasion) : row.occasion,
    swatch: typeof row.swatch === 'string' ? JSON.parse(row.swatch) : row.swatch
  };
}

// GET /api/sarees
router.get('/', (req, res) => {
  try {
    const { occasion, color, sort = 'popular', q, badge } = req.query;

    let rows = db.prepare('SELECT * FROM sarees').all().map(formatSaree);

    // Filter by occasion
    if (occasion && occasion !== 'all') {
      rows = rows.filter(s => Array.isArray(s.occasion) && s.occasion.includes(occasion.toLowerCase()));
    }

    // Filter by color
    if (color && color !== 'all') {
      rows = rows.filter(s => s.color.toLowerCase() === color.toLowerCase());
    }

    // Filter by badge
    if (badge) {
      rows = rows.filter(s => s.badge && s.badge.toLowerCase().includes(badge.toLowerCase()));
    }

    // Search query
    if (q) {
      const queryLower = q.toLowerCase();
      rows = rows.filter(s =>
        s.name.toLowerCase().includes(queryLower) ||
        (s.motif && s.motif.toLowerCase().includes(queryLower)) ||
        (s.border && s.border.toLowerCase().includes(queryLower)) ||
        (s.weave && s.weave.toLowerCase().includes(queryLower)) ||
        (s.blurb && s.blurb.toLowerCase().includes(queryLower))
      );
    }

    // Sorting
    if (sort === 'price-asc') {
      rows.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      rows.sort((a, b) => b.price - a.price);
    } else if (sort === 'popular') {
      // Prioritize items with badges
      rows.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
    }

    return res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching sarees:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve saree collection.' });
  }
});

// GET /api/sarees/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM sarees WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Saree not found.' });
    }

    const saree = formatSaree(row);

    // Also fetch related sarees with overlapping occasion
    const all = db.prepare('SELECT * FROM sarees WHERE id != ?').all(req.params.id).map(formatSaree);
    const related = all.filter(s => Array.isArray(s.occasion) && s.occasion.some(o => saree.occasion.includes(o))).slice(0, 4);

    return res.json({
      success: true,
      data: saree,
      related: related.length ? related : all.slice(0, 4)
    });
  } catch (err) {
    console.error('Error fetching saree detail:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve saree details.' });
  }
});

// POST /api/sarees (Employee only)
router.post('/', authenticateToken, requireRole('employee', 'admin'), (req, res) => {
  try {
    const { id, name, price, occasion, color, swatch, border, motif, zari, weave, badge, blurb } = req.body;

    if (!name || !price || !occasion || !color) {
      return res.status(400).json({ success: false, error: 'Name, price, occasion, and color are required.' });
    }

    const sareeId = id || 'sp-' + String(Date.now()).slice(-4);
    const occasionArr = Array.isArray(occasion) ? occasion : [occasion];
    const swatchArr = Array.isArray(swatch) ? swatch : ['#6B1E2B', '#C9972C'];

    const stmt = db.prepare(`
      INSERT INTO sarees (id, name, price, occasion, color, swatch, border, motif, zari, weave, badge, blurb)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      sareeId,
      name.trim(),
      Number(price),
      JSON.stringify(occasionArr),
      color.trim().toLowerCase(),
      JSON.stringify(swatchArr),
      border || 'Paithani border',
      motif || 'Peacock',
      zari || 'Real gold zari',
      weave || 'Handwoven, Paithan',
      badge || '',
      blurb || ''
    );

    const created = formatSaree(db.prepare('SELECT * FROM sarees WHERE id = ?').get(sareeId));

    return res.status(201).json({
      success: true,
      message: 'Saree successfully added to catalog.',
      data: created
    });
  } catch (err) {
    console.error('Error creating saree:', err);
    return res.status(500).json({ success: false, error: 'Failed to add saree to catalog.' });
  }
});

// PUT /api/sarees/:id (Employee only)
router.put('/:id', authenticateToken, requireRole('employee', 'admin'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM sarees WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Saree not found.' });
    }

    const { name, price, occasion, color, swatch, border, motif, zari, weave, badge, blurb } = req.body;

    const updatedOccasion = occasion ? (Array.isArray(occasion) ? occasion : [occasion]) : JSON.parse(existing.occasion);
    const updatedSwatch = swatch ? (Array.isArray(swatch) ? swatch : [swatch]) : JSON.parse(existing.swatch);

    const stmt = db.prepare(`
      UPDATE sarees
      SET name = ?, price = ?, occasion = ?, color = ?, swatch = ?, border = ?, motif = ?, zari = ?, weave = ?, badge = ?, blurb = ?
      WHERE id = ?
    `);

    stmt.run(
      name ? name.trim() : existing.name,
      price !== undefined ? Number(price) : existing.price,
      JSON.stringify(updatedOccasion),
      color ? color.trim().toLowerCase() : existing.color,
      JSON.stringify(updatedSwatch),
      border !== undefined ? border : existing.border,
      motif !== undefined ? motif : existing.motif,
      zari !== undefined ? zari : existing.zari,
      weave !== undefined ? weave : existing.weave,
      badge !== undefined ? badge : existing.badge,
      blurb !== undefined ? blurb : existing.blurb,
      req.params.id
    );

    const updated = formatSaree(db.prepare('SELECT * FROM sarees WHERE id = ?').get(req.params.id));

    return res.json({
      success: true,
      message: 'Saree updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Error updating saree:', err);
    return res.status(500).json({ success: false, error: 'Failed to update saree.' });
  }
});

// DELETE /api/sarees/:id (Employee only)
router.delete('/:id', authenticateToken, requireRole('employee', 'admin'), (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM sarees WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Saree not found.' });
    }

    db.prepare('DELETE FROM sarees WHERE id = ?').run(req.params.id);

    return res.json({ success: true, message: 'Saree removed from catalog.' });
  } catch (err) {
    console.error('Error deleting saree:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete saree.' });
  }
});

module.exports = router;
