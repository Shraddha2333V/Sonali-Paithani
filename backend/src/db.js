const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'sonali_paithani.db');
const resolvedDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(__dirname, '..', dbPath);

// Ensure directory exists
const dir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new DatabaseSync(resolvedDbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'employee', 'admin')),
      employee_id TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sarees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      occasion TEXT NOT NULL,
      color TEXT NOT NULL,
      swatch TEXT NOT NULL,
      border TEXT NOT NULL,
      motif TEXT NOT NULL,
      zari TEXT NOT NULL,
      weave TEXT NOT NULL,
      badge TEXT,
      blurb TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      saree_id TEXT,
      saree_name TEXT NOT NULL,
      preferred_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      user_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      saree_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, saree_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // 1. Seed Sarees if empty
  const sareeCount = db.prepare('SELECT COUNT(*) as count FROM sarees').get().count;
  if (sareeCount === 0) {
    const SAREES = [
      {
        id: "sp-001",
        name: "Kalyani Kalash Bridal Paithani",
        price: 68000,
        occasion: ["wedding", "reception"],
        color: "maroon",
        swatch: ["#6B1E2B", "#C9972C"],
        border: "Narali (coconut) border, single-pallu peacock",
        motif: "Peacock (Mor)",
        zari: "Real gold zari",
        weave: "Handwoven, Paithan",
        badge: "Bestseller",
        blurb: "A heavyweight bridal Paithani with a dense gold peacock pallu — the kind that's meant to be handed down."
      },
      {
        id: "sp-002",
        name: "Asawali Vine Festive Paithani",
        price: 24500,
        occasion: ["festive", "haldi", "gifting"],
        color: "green",
        swatch: ["#1F6E63", "#E8B84B"],
        border: "Asawali vine border",
        motif: "Parrot (Popat)",
        zari: "Gold-tissue zari",
        weave: "Handwoven, Yeola",
        badge: "New Arrival",
        blurb: "Deep peacock-green body with a running vine border — bright enough for Haldi, understated enough for the office after."
      },
      {
        id: "sp-003",
        name: "Shirodak Ivory Reception Paithani",
        price: 41200,
        occasion: ["reception", "wedding"],
        color: "ivory",
        swatch: ["#F3E7D2", "#C9972C"],
        border: "Muniya (bird) border",
        motif: "Lotus (Kamal)",
        zari: "Real silver-gold zari",
        weave: "Handwoven, Paithan",
        badge: "",
        blurb: "A pale Shirodak base lets the zari do the talking — a favourite for daytime receptions and mehendi."
      },
      {
        id: "sp-004",
        name: "Kalichandrakala Classic Paithani",
        price: 32000,
        occasion: ["festive", "wedding"],
        color: "black",
        swatch: ["#241417", "#C9972C"],
        border: "Bangdi Mor (peacock coin) border",
        motif: "Peacock (Mor)",
        zari: "Real gold zari",
        weave: "Handwoven, Paithan",
        badge: "Heritage",
        blurb: "Black body, red pallu — the archetypal Paithani colour pairing, worn for centuries at Maharashtrian weddings."
      },
      {
        id: "sp-005",
        name: "Rani Pink Office-Silk Paithani",
        price: 12800,
        occasion: ["office", "gifting"],
        color: "pink",
        swatch: ["#B23A5C", "#E8B84B"],
        border: "Narrow zari border",
        motif: "Minimal butta",
        zari: "Half-fine zari",
        weave: "Semi-Paithani, machine-assisted border",
        badge: "Under ₹15k",
        blurb: "A lighter, easier-to-drape Paithani for pujas and Saturday-office wear — same palette, gentler price."
      },
      {
        id: "sp-006",
        name: "Basant Yellow Haldi Paithani",
        price: 18500,
        occasion: ["haldi", "festive"],
        color: "yellow",
        swatch: ["#E7A93B", "#6B1E2B"],
        border: "Kalash border",
        motif: "Kalash & vine",
        zari: "Gold-tissue zari",
        weave: "Handwoven, Yeola",
        badge: "",
        blurb: "Turmeric-yellow with a maroon pallu — sized for a Haldi ceremony you'll actually want to dance in."
      },
      {
        id: "sp-007",
        name: "Peshwai Maroon Diwali Paithani",
        price: 27500,
        occasion: ["festive", "gifting"],
        color: "maroon",
        swatch: ["#7A1F2B", "#E8B84B"],
        border: "Narali border, twin pallu",
        motif: "Peacock & lotus",
        zari: "Real gold zari",
        weave: "Handwoven, Paithan",
        badge: "Festive Pick",
        blurb: "Rich enough for Diwali evenings, worn just as well for Lakshmi puja the morning after."
      },
      {
        id: "sp-008",
        name: "Neel Kamal Reception Paithani",
        price: 52000,
        occasion: ["reception", "wedding"],
        color: "blue",
        swatch: ["#1E3A5F", "#C9972C"],
        border: "Lotus-chain border",
        motif: "Lotus (Kamal)",
        zari: "Real gold zari",
        weave: "Handwoven, Paithan",
        badge: "",
        blurb: "An unusual indigo base for brides who want the Paithani weave without the expected maroon."
      },
      {
        id: "sp-009",
        name: "Gift-Box Mor Butti Paithani",
        price: 9800,
        occasion: ["gifting", "office"],
        color: "green",
        swatch: ["#2E6B4F", "#E8B84B"],
        border: "Simple zari line",
        motif: "Small peacock butti",
        zari: "Half-fine zari",
        weave: "Semi-Paithani",
        badge: "Under ₹15k",
        blurb: "Comes in our signature gift box — the one people buy for a mother-in-law they're trying to impress."
      },
      {
        id: "sp-010",
        name: "Ajanta Red Bridal Paithani",
        price: 89000,
        occasion: ["wedding"],
        color: "red",
        swatch: ["#8A1F2A", "#E8B84B"],
        border: "Double narali border, full zari pallu",
        motif: "Peacock, parrot & lotus",
        zari: "Real gold zari, heavy pallu",
        weave: "Handwoven, Paithan — 3 month weave",
        badge: "Heirloom",
        blurb: "Our most elaborate piece — a single weaver spends close to three months on the pallu alone."
      }
    ];

    const insertSaree = db.prepare(`
      INSERT INTO sarees (id, name, price, occasion, color, swatch, border, motif, zari, weave, badge, blurb)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of SAREES) {
      insertSaree.run(
        s.id,
        s.name,
        s.price,
        JSON.stringify(s.occasion),
        s.color,
        JSON.stringify(s.swatch),
        s.border,
        s.motif,
        s.zari,
        s.weave,
        s.badge || '',
        s.blurb || ''
      );
    }
  }

  // 2. Seed Default Staff and Customer Users if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, employee_id, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Staff user
    insertUser.run(
      'Aarti Kadam',
      'staff@sonalipaithani.com',
      '9822011223',
      defaultPasswordHash,
      'employee',
      'SP-001',
      'Yeola'
    );

    // Customer user
    insertUser.run(
      'Priya Joshi',
      'customer@example.com',
      '9876543210',
      defaultPasswordHash,
      'customer',
      null,
      null
    );
  }

  // 3. Seed Sample Bookings if empty
  const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
  if (bookingCount === 0) {
    const sampleBookings = [
      { customer: "Aarti Deshmukh", phone: "9823123456", sareeId: "sp-001", saree: "Kalyani Kalash Bridal Paithani", date: "2026-08-24", status: "pending" },
      { customer: "Neha Kulkarni", phone: "9823123457", sareeId: "sp-002", saree: "Asawali Vine Festive Paithani", date: "2026-08-23", status: "confirmed" },
      { customer: "Priya Joshi", phone: "9876543210", sareeId: "sp-010", saree: "Ajanta Red Bridal Paithani", date: "2026-08-22", status: "confirmed" },
      { customer: "Sanika Patil", phone: "9823123459", sareeId: "sp-008", saree: "Neel Kamal Reception Paithani", date: "2026-08-26", status: "pending" },
      { customer: "Meera Rane", phone: "9823123460", sareeId: "sp-006", saree: "Basant Yellow Haldi Paithani", date: "2026-08-21", status: "confirmed" }
    ];

    const insertBooking = db.prepare(`
      INSERT INTO bookings (customer_name, customer_phone, saree_id, saree_name, preferred_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const b of sampleBookings) {
      insertBooking.run(b.customer, b.phone, b.sareeId, b.saree, b.date, b.status);
    }
  }
}

// Run init
initDb();

module.exports = db;
