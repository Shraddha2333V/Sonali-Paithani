const express = require('express');
const router = express.Router();
const db = require('../db');

function formatSaree(row) {
  if (!row) return null;
  return {
    ...row,
    image: row.image || `assets/products/${row.id}.jpg`,
    occasion: typeof row.occasion === 'string' ? JSON.parse(row.occasion) : row.occasion,
    swatch: typeof row.swatch === 'string' ? JSON.parse(row.swatch) : row.swatch
  };
}

const OCCASION_GUIDE = {
  wedding: { label: "Wedding", note: "heavier zari, richer palette — meant to carry a whole ceremony" },
  reception: { label: "Reception", note: "lighter weight so it photographs and dances well" },
  haldi: { label: "Haldi", note: "yellow/green tones, easier fabric for a daytime ceremony" },
  festive: { label: "Festive / Diwali", note: "warm, celebratory colours without full bridal weight" },
  office: { label: "Office / Puja", note: "lighter Paithani-weave silk, easier to drape and re-wear" },
  gifting: { label: "Gifting", note: "gift-box ready, safer colours, a range of budgets" },
};

const budgetRanges = {
  "Under ₹15k": [0, 15000],
  "₹15k–₹35k": [15000, 35000],
  "₹35k–₹60k": [35000, 60000],
  "₹60k+": [60000, Infinity],
};

function parseFreeText(text) {
  const lower = text.toLowerCase();
  let detectedOccasion = null;
  let detectedColor = null;
  let minBudget = 0;
  let maxBudget = Infinity;

  // Detect occasion
  for (const [key, val] of Object.entries(OCCASION_GUIDE)) {
    if (lower.includes(key) || lower.includes(val.label.toLowerCase())) {
      detectedOccasion = key;
      break;
    }
  }
  if (!detectedOccasion) {
    if (lower.includes('bride') || lower.includes('bridal') || lower.includes('shaadi') || lower.includes('marriage')) detectedOccasion = 'wedding';
    else if (lower.includes('sangeet') || lower.includes('cocktail') || lower.includes('party')) detectedOccasion = 'reception';
    else if (lower.includes('diwali') || lower.includes('pooja') || lower.includes('puja')) detectedOccasion = 'festive';
    else if (lower.includes('gift') || lower.includes('present')) detectedOccasion = 'gifting';
    else if (lower.includes('haldi') || lower.includes('mehendi') || lower.includes('turmeric')) detectedOccasion = 'haldi';
  }

  // Detect colors
  const colors = ['maroon', 'green', 'blue', 'yellow', 'black', 'pink', 'red', 'ivory'];
  for (const c of colors) {
    if (lower.includes(c)) {
      detectedColor = c;
      break;
    }
  }

  // Detect budget numbers like "30k", "50000", "under 20000"
  const kMatch = lower.match(/(\d+)\s*k/);
  if (kMatch) {
    const val = parseInt(kMatch[1], 10) * 1000;
    if (lower.includes('under') || lower.includes('below') || lower.includes('less than')) {
      maxBudget = val;
    } else {
      minBudget = Math.max(0, val - 10000);
      maxBudget = val + 15000;
    }
  }

  const numMatch = lower.match(/(?:under|below|around|approx)?\s*(?:₹|rs\.?|inr)?\s*(\d{4,6})/);
  if (numMatch && !kMatch) {
    const val = parseInt(numMatch[1], 10);
    if (lower.includes('under') || lower.includes('below')) {
      maxBudget = val;
    } else {
      minBudget = Math.max(0, val - 8000);
      maxBudget = val + 10000;
    }
  }

  return { detectedOccasion, detectedColor, minBudget, maxBudget };
}

function getMatchedSarees(targetOccasion, targetColor, minPrice, maxPrice) {
  const allSarees = db.prepare('SELECT * FROM sarees').all().map(formatSaree);

  function score(saree) {
    let s = 0;
    if (targetOccasion && saree.occasion.includes(targetOccasion)) s += 5;
    if (saree.price >= minPrice && saree.price <= maxPrice) s += 4;
    else if (maxPrice < Infinity && saree.price > maxPrice) s -= 3;

    if (targetColor && saree.color.toLowerCase() === targetColor) s += 4;
    if (saree.badge === 'Bestseller' || saree.badge === 'Heirloom') s += 1;
    return s;
  }

  function reasonFor(saree) {
    const bits = [];
    if (targetOccasion && saree.occasion.includes(targetOccasion)) {
      bits.push(OCCASION_GUIDE[targetOccasion]?.note || `perfect for ${targetOccasion}`);
    }
    if (targetColor && saree.color.toLowerCase() === targetColor) {
      bits.push(`in rich ${targetColor} tones`);
    }
    if (saree.price >= minPrice && saree.price <= maxPrice && maxPrice < Infinity) {
      bits.push(`within your ₹${Number(maxPrice).toLocaleString('en-IN')} budget`);
    }
    return bits.length ? bits.join(', ') : 'a timeless handloom pick from our loom';
  }

  const scored = allSarees.map(saree => ({
    saree,
    score: score(saree),
    reason: reasonFor(saree)
  }))
  .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(item => ({
    ...item.saree,
    recommendationReason: item.reason,
    matchScore: item.score
  }));
}

// POST /api/stylist/chat - Conversational Natural Chatbot Endpoint
router.post('/chat', (req, res) => {
  try {
    const message = (req.body.message || req.body.text || '').trim();
    const lower = message.toLowerCase();

    // 1. GREETINGS (e.g. "hii", "hello", "hey", "namaste", "good morning")
    const isGreeting = /^(hi|hii|hiii|hello|hey|heyy|namaste|namaskar|pranam|ram ram|good\s*(morning|afternoon|evening)|hola|sup|yo)\b/i.test(message) ||
                       (lower === 'hi' || lower === 'hii' || lower === 'hello' || lower === 'hey');

    if (isGreeting) {
      return res.json({
        success: true,
        type: 'greeting',
        reply: `Namaste! 🙏 Welcome to Sonali Paithani. I am your virtual stylist and store assistant.<br><br>How may I help you today? You can ask me to recommend a saree for an upcoming event, check our pricing, or get details about our Yeola handloom showroom.`,
        suggestions: [
          'Show Bridal Sarees',
          'Haldi & Festive Picks',
          'Where is your shop?',
          'What is your price range?'
        ],
        recommendations: []
      });
    }

    // 2. WHO ARE YOU / CAPABILITIES
    if (/\b(who are you|what can you do|about you|help me|your name)\b/i.test(lower)) {
      return res.json({
        success: true,
        type: 'identity',
        reply: `I'm the <strong>Sonali Paithani AI Stylist</strong>! ✨<br><br>I can:<br>• Find sarees tailored to your occasion, preferred colour, and budget<br>• Share details about our authentic handwoven silk & zari heritage<br>• Help you book a viewing slot at our Yeola shop or via video call<br>• Direct you to our WhatsApp specialists for custom orders.`,
        suggestions: [
          'Recommend for Wedding',
          'Shop by Occasion',
          'Book a Viewing',
          'Chat on WhatsApp'
        ],
        recommendations: []
      });
    }

    // 3. STORE LOCATION / ADDRESS / TIMINGS
    if (/\b(where|location|address|shop|store|showroom|directions|reach|city|yeola|paithan|nashik|map|timing|hours|open)\b/i.test(lower)) {
      return res.json({
        success: true,
        type: 'location',
        reply: `📍 <strong>Our Showroom Location:</strong><br>Sonali Paithani, Yeola, Nashik District, Maharashtra — the historic cradle of authentic Paithani handlooms.<br><br>🕒 <strong>Hours:</strong> Monday – Saturday, 10:00 AM – 8:00 PM (Closed Sundays).<br><br>We also provide virtual video-call viewings if you are visiting from outside Nashik/Mumbai/Pune!`,
        suggestions: [
          'Book an in-shop Viewing',
          'Message on WhatsApp',
          'Explore Collections'
        ],
        recommendations: []
      });
    }

    // 4. CONTACT / PHONE / WHATSAPP
    if (/\b(contact|phone|number|whatsapp|call|email|reach|talk to human|agent|support)\b/i.test(lower)) {
      return res.json({
        success: true,
        type: 'contact',
        reply: `📞 <strong>Contact Sonali Paithani:</strong><br>• <strong>WhatsApp / Call:</strong> +91 12345 67890<br>• <strong>Email:</strong> hello@sonalipaithani.example<br>• <strong>Instagram:</strong> @sonalipaithani<br><br>Our team is available to send high-definition pallu videos and assist you with bespoke bridal orders.`,
        suggestions: [
          'Chat on WhatsApp',
          'Book a Viewing'
        ],
        recommendations: []
      });
    }

    // 5. PRICING & BUDGET INQUIRIES
    if (/\b(price|pricing|rates?|cost|how much|budget|cheap|expensive|starting price|discount|offers?)\b/i.test(lower) && !lower.includes('wedding') && !lower.includes('bridal') && !lower.includes('haldi')) {
      return res.json({
        success: true,
        type: 'pricing',
        reply: `💎 <strong>Our Price Ranges:</strong><br>• <strong>Everyday & Gifting Silk:</strong> ₹9,800 – ₹15,000<br>• <strong>Festive & Haldi Sarees:</strong> ₹18,500 – ₹32,000<br>• <strong>Reception Elegance:</strong> ₹41,200 – ₹52,000<br>• <strong>Heirloom Bridal Paithani:</strong> ₹68,000 – ₹89,000+ (Heavy real gold zari pallu, handwoven over 2–3 months).<br><br>Which range would you like to explore?`,
        suggestions: [
          'Under ₹15k',
          '₹15k–₹35k',
          '₹35k–₹60k',
          '₹60k+'
        ],
        recommendations: []
      });
    }

    // 6. AUTHENTICITY / SILK PURITY / ZARI
    if (/\b(pure|silk|real|original|authentic|authenticity|zari|gold|handloom|powerloom|machine|material|quality)\b/i.test(lower)) {
      return res.json({
        success: true,
        type: 'authenticity',
        reply: `✨ <strong>100% Handloom Authenticity:</strong><br>Every Sonali Paithani saree is woven with pure Mulberry silk on traditional hand-throw shuttle looms in Yeola and Paithan. Our bridal pieces use genuine silver/gold tested zari with classic Narali borders and Peacock (Mor) / Parrot (Popat) buttis.<br><br>We never drop-ship or sell synthetic machine imitations.`,
        suggestions: [
          'See Bridal Sarees',
          'Heritage Paithani',
          'Our Story'
        ],
        recommendations: []
      });
    }

    // 7. HOW TO BOOK A VIEWING
    if (/\b(book|booking|viewing|appointment|slot|visit appointment)\b/i.test(lower)) {
      return res.json({
        success: true,
        type: 'booking',
        reply: `🛍️ <strong>Booking a Viewing:</strong><br>You can reserve an in-person viewing slot at our Yeola boutique or schedule a live video drape consultation.<br><br>Simply open any saree on the site, tap <strong>'Book a Viewing'</strong>, enter your contact details, and our staff will confirm your slot!`,
        suggestions: [
          'Browse Collections',
          'Message on WhatsApp'
        ],
        recommendations: []
      });
    }

    // 8. GRATITUDE / FAREWELL
    if (/\b(thanks|thank you|dhanyavad|shukriya|great|awesome|perfect|bye|goodbye|see you)\b/i.test(lower)) {
      return res.json({
        success: true,
        type: 'farewell',
        reply: `You're most welcome! 🙏 It's always an honor to assist you with Maharashtra's royal weave. Let me know if you need any other styling suggestions. Have a wonderful day!`,
        suggestions: [
          'Browse All Sarees',
          'Start over'
        ],
        recommendations: []
      });
    }

    // 9. PRODUCT / OCCASION / COLOR / BUDGET SPECIFIC QUERIES
    const parsed = parseFreeText(message);
    const hasSareeIntent = parsed.detectedOccasion ||
                           parsed.detectedColor ||
                           parsed.maxBudget < Infinity ||
                           /\b(saree|paithani|collection|wear|buy|show|recommend|look|dress|bridal|wedding|haldi|reception|festive|diwali|office|puja|gift)\b/i.test(lower);

    if (hasSareeIntent) {
      const occasion = parsed.detectedOccasion;
      const color = parsed.detectedColor;
      const recs = getMatchedSarees(occasion, color, parsed.minBudget, parsed.maxBudget);

      let intro = "Here are our finest handwoven picks";
      if (occasion) intro += ` for your <strong>${OCCASION_GUIDE[occasion]?.label || occasion}</strong>`;
      if (color) intro += ` in <strong>${color}</strong>`;
      if (parsed.maxBudget < Infinity) intro += ` within ₹${Number(parsed.maxBudget).toLocaleString('en-IN')}`;
      intro += `:`;

      return res.json({
        success: true,
        type: 'recommendation',
        reply: intro,
        suggestions: [
          'Explore All Sarees',
          'Book a Viewing',
          'Chat on WhatsApp'
        ],
        recommendations: recs
      });
    }

    // 10. GENERAL HELPFUL FALLBACK
    return res.json({
      success: true,
      type: 'general',
      reply: `I'd love to help you find the right saree! 🙏 Could you share:<br><br>1. <strong>Occasion:</strong> Wedding, Reception, Haldi, Festive, or Gifting?<br>2. <strong>Preferred Colour:</strong> Maroon, Peacock Green, Royal Blue, Yellow, etc.<br>3. <strong>Target Budget:</strong> Under ₹15k, ₹15k–₹35k, or Bridal (₹60k+)?`,
      suggestions: [
        'Bridal Paithani',
        'Haldi Collection',
        'Festive Sarees',
        'Show Sarees under ₹30k'
      ],
      recommendations: []
    });

  } catch (err) {
    console.error('Error in chatbot:', err);
    return res.status(500).json({
      success: false,
      reply: 'Namaste! I had a brief issue accessing our inventory. How may I assist you with our Paithani sarees?',
      suggestions: ['Show Bridal Sarees', 'Browse Collection']
    });
  }
});

// POST /api/stylist/recommend - Backward compatibility for structured multi-step flow
router.post('/recommend', (req, res) => {
  try {
    const { occasion, budget, color, message } = req.body;

    let targetOccasion = occasion ? occasion.toLowerCase() : null;
    let targetColor = color && color.toLowerCase() !== 'skip' ? color.toLowerCase() : null;
    let [minPrice, maxPrice] = [0, Infinity];

    if (budget && budgetRanges[budget]) {
      [minPrice, maxPrice] = budgetRanges[budget];
    }

    if (message) {
      const parsed = parseFreeText(message);
      if (!targetOccasion && parsed.detectedOccasion) targetOccasion = parsed.detectedOccasion;
      if (!targetColor && parsed.detectedColor) targetColor = parsed.detectedColor;
      if (budget === undefined && (parsed.minBudget > 0 || parsed.maxBudget < Infinity)) {
        minPrice = parsed.minBudget;
        maxPrice = parsed.maxBudget;
      }
    }

    const recommendations = getMatchedSarees(targetOccasion, targetColor, minPrice, maxPrice);

    return res.json({
      success: true,
      parameters: {
        occasion: targetOccasion,
        budget: budget || `${minPrice}-${maxPrice}`,
        color: targetColor
      },
      recommendations
    });
  } catch (err) {
    console.error('Error recommending sarees:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate recommendations.' });
  }
});

module.exports = router;
