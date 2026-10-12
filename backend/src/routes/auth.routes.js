const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  try {
    const { name, email, phone, password, role = 'customer', employeeId, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const safeRole = role === 'employee' ? 'employee' : 'customer';

    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, employee_id, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      name.trim(),
      cleanEmail,
      phone ? phone.trim() : null,
      passwordHash,
      safeRole,
      safeRole === 'employee' ? (employeeId || '').trim() : null,
      safeRole === 'employee' ? (location || 'Yeola').trim() : null
    );

    const newUser = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      role: safeRole,
      employee_id: safeRole === 'employee' ? (employeeId || '').trim() : null,
      location: safeRole === 'employee' ? (location || 'Yeola').trim() : null
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while creating account.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { loginId, email, password, expectedRole } = req.body;
    const identifier = (loginId || email || '').trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/phone and password are required.' });
    }

    // Lookup user by email or phone
    const user = db.prepare(`
      SELECT * FROM users WHERE email = ? OR phone = ?
    `).get(identifier, identifier);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email/phone or password.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email/phone or password.' });
    }

    // Role check warning or handling (optional role hint)
    if (expectedRole && user.role !== expectedRole) {
      // Still log them in or inform them of their assigned role
    }

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      employee_id: user.employee_id,
      location: user.location
    };

    const token = generateToken(userProfile);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, role, employee_id, location, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error('Auth /me error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
});

module.exports = router;
