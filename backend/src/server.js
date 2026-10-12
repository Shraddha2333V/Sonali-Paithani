require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');

// Ensure DB is initialized
require('./db');

const authRoutes = require('./routes/auth.routes');
const sareesRoutes = require('./routes/sarees.routes');
const bookingsRoutes = require('./routes/bookings.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const stylistRoutes = require('./routes/stylist.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Sonali Paithani API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sarees', sareesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stylist', stylistRoutes);

// Optional: static serving of frontend if run in unified mode
const frontendPath = path.join(__dirname, '..', '..', 'Sonali_Paithani_Final');
app.use(express.static(frontendPath));

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Sonali Paithani Backend Server is running!`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Serving frontend at: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

module.exports = { app, server };
