/**
 * SONALI PAITHANI — sample catalog data
 * -------------------------------------------------------------
 * This is placeholder/demo data so the site is fully browsable
 * out of the box. Replace with the real catalog by either:
 *   1) Editing the SAREES array below by hand, or
 *   2) Fetching from a real backend/CMS (see README "Next steps")
 *
 * image: left empty on purpose — real product photography goes
 * here. Until then, each card renders a generated silk-toned
 * gradient swatch using `swatch` so the site never shows broken
 * images.
 * -------------------------------------------------------------
 */

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
  },
];

// Occasion -> friendly label + short guidance used by the chatbot
const OCCASION_GUIDE = {
  wedding:   { label: "Wedding",        note: "heavier zari, richer palette — meant to carry a whole ceremony" },
  reception: { label: "Reception",      note: "lighter weight so it photographs and dances well" },
  haldi:     { label: "Haldi",          note: "yellow/green tones, easier fabric for a daytime ceremony" },
  festive:   { label: "Festive / Diwali", note: "warm, celebratory colours without full bridal weight" },
  office:    { label: "Office / Puja",  note: "lighter Paithani-weave silk, easier to drape and re-wear" },
  gifting:   { label: "Gifting",        note: "gift-box ready, safer colours, a range of budgets" },
};

const SHOP_INFO = {
  name: "Sonali Paithani",
  tagline: "Handwoven in Paithan. Chosen for you.",
  whatsapp: "911234567890", // placeholder — replace with real number
  email: "hello@sonalipaithani.example",
  instagram: "https://instagram.com/sonalipaithani",
};

// Sample "Book a Viewing" requests — used only by employee-dashboard.html
// to demonstrate what staff would see. Replace with a real bookings API
// once one exists (see README "Next steps").
const MOCK_BOOKINGS = [
  { customer: "Aarti Deshmukh", saree: "Kalyani Kalash Bridal Paithani", date: "24 Aug 2026", status: "pending" },
  { customer: "Neha Kulkarni", saree: "Asawali Vine Festive Paithani", date: "23 Aug 2026", status: "confirmed" },
  { customer: "Priya Joshi", saree: "Ajanta Red Bridal Paithani", date: "22 Aug 2026", status: "confirmed" },
  { customer: "Sanika Patil", saree: "Neel Kamal Reception Paithani", date: "26 Aug 2026", status: "pending" },
  { customer: "Meera Rane", saree: "Basant Yellow Haldi Paithani", date: "21 Aug 2026", status: "confirmed" },
];
