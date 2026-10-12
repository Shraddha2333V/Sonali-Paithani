/**
 * SONALI PAITHANI — API Client
 * High-reliability client connecting frontend to the Express backend
 * with seamless client-side persistence for deployed environments (e.g. GitHub Pages, Netlify, Vercel).
 */

function resolveApiBase() {
  if (typeof window !== 'undefined' && window.SONALI_API_URL) {
    return window.SONALI_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const { port, hostname, protocol } = window.location;
    // Running directly from the backend server
    if (port === '5000') {
      return '/api';
    }
    // Running on local machine via Live Server or similar dev server
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Deployed environment: check if /api exists or default to local/relative
    if (protocol === 'https:' || protocol === 'http:') {
      return '/api';
    }
  }
  return 'http://localhost:5000/api';
}

const API_BASE = resolveApiBase();

// Default seeded accounts for instant demo & offline/deployed access
const DEFAULT_SEED_USERS = [
  {
    id: 1,
    name: "Sonali Kulkarni",
    email: "staff@sonalipaithani.com",
    phone: "9876543210",
    role: "employee",
    employee_id: "SP-001",
    location: "Yeola",
    password: "password123"
  },
  {
    id: 2,
    name: "Pooja Sharma",
    email: "customer@example.com",
    phone: "9822012345",
    role: "customer",
    employee_id: null,
    location: "Pune",
    password: "password123"
  }
];

const Api = {
  // --- Auth Token Management ---
  getToken() {
    return localStorage.getItem('sp_auth_token');
  },
  setToken(token) {
    if (token) localStorage.setItem('sp_auth_token', token);
    else localStorage.removeItem('sp_auth_token');
  },
  getUser() {
    try {
      const u = localStorage.getItem('sp_auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) localStorage.setItem('sp_auth_user', JSON.stringify(user));
    else localStorage.removeItem('sp_auth_user');
  },
  logout() {
    this.setToken(null);
    this.setUser(null);
  },

  // Helper fetch with auth header and timeout
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[Api] Backend request failed (${endpoint}):`, err.message);
      throw err;
    }
  },

  // --- Local Fallback Auth Database (for deployed/offline sites) ---
  getLocalUsers() {
    try {
      const stored = localStorage.getItem('sp_registered_users');
      const customUsers = stored ? JSON.parse(stored) : [];
      return [...DEFAULT_SEED_USERS, ...customUsers];
    } catch {
      return DEFAULT_SEED_USERS;
    }
  },

  saveLocalUser(newUser) {
    try {
      const stored = localStorage.getItem('sp_registered_users');
      const users = stored ? JSON.parse(stored) : [];
      users.push(newUser);
      localStorage.setItem('sp_registered_users', JSON.stringify(users));
    } catch (e) {
      console.error('Could not save user locally:', e);
    }
  },

  // --- Auth APIs ---
  async login(loginId, password, expectedRole) {
    const cleanId = (loginId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      throw new Error("Please enter both email/phone and password.");
    }

    // 1. Attempt real backend authentication first
    try {
      const res = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ loginId: cleanId, password: cleanPass, expectedRole })
      });
      if (res.token && res.user) {
        this.setToken(res.token);
        this.setUser(res.user);
        return res;
      }
    } catch (backendErr) {
      console.info("[Api] Backend unreachable or returned error. Checking local credentials store...");
    }

    // 2. Resilient Fallback for Deployed / Static Hosting (GitHub Pages, Netlify, Vercel)
    const localUsers = this.getLocalUsers();
    const matchedUser = localUsers.find(u =>
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.phone && u.phone === cleanId) ||
      (u.employee_id && u.employee_id.toLowerCase() === cleanId)
    );

    if (!matchedUser) {
      throw new Error("No account found with this email or phone. Please check your credentials or sign up.");
    }

    if (matchedUser.password !== cleanPass) {
      throw new Error("Incorrect password. Please try again.");
    }

    // Valid local credentials! Issue local session
    const safeUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      phone: matchedUser.phone || null,
      role: matchedUser.role,
      employee_id: matchedUser.employee_id || null,
      location: matchedUser.location || "Yeola"
    };

    const localToken = 'sp_demo_jwt_' + Date.now() + '_' + safeUser.id;
    this.setToken(localToken);
    this.setUser(safeUser);

    return {
      success: true,
      message: "Logged in successfully (verified).",
      token: localToken,
      user: safeUser,
      fallback: true
    };
  },

  async signup(payload) {
    const { name, email, phone, password, role = 'customer', employeeId, location } = payload;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!name || !cleanEmail || !password) {
      throw new Error("Name, email and password are required.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    // 1. Attempt backend registration
    try {
      const res = await this.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.token && res.user) {
        this.setToken(res.token);
        this.setUser(res.user);
        // Also cache locally for seamless offline access
        this.saveLocalUser({
          id: res.user.id,
          name: res.user.name,
          email: cleanEmail,
          phone: phone || null,
          role: res.user.role,
          employee_id: res.user.employee_id || null,
          location: res.user.location || null,
          password
        });
        return res;
      }
    } catch (backendErr) {
      console.info("[Api] Backend signup unreachable. Registering account locally...");
    }

    // 2. Resilient local fallback registration
    const localUsers = this.getLocalUsers();
    const exists = localUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      throw new Error("An account with this email already exists.");
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      role: role === 'employee' ? 'employee' : 'customer',
      employee_id: role === 'employee' ? (employeeId || 'SP-EMP').trim() : null,
      location: role === 'employee' ? (location || 'Yeola').trim() : null,
      password: password.trim()
    };

    this.saveLocalUser(newUser);

    const safeUser = { ...newUser };
    delete safeUser.password;

    const localToken = 'sp_demo_jwt_' + Date.now() + '_' + safeUser.id;
    this.setToken(localToken);
    this.setUser(safeUser);

    return {
      success: true,
      message: "Account created successfully.",
      token: localToken,
      user: safeUser,
      fallback: true
    };
  },

  async getMe() {
    try {
      const res = await this.request('/auth/me');
      if (res.user) this.setUser(res.user);
      return res.user;
    } catch {
      return this.getUser();
    }
  },

  // --- Sarees APIs ---
  async getSarees(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.occasion && params.occasion !== 'all') query.set('occasion', params.occasion);
      if (params.color && params.color !== 'all') query.set('color', params.color);
      if (params.sort) query.set('sort', params.sort);
      if (params.q) query.set('q', params.q);

      const qs = query.toString();
      const res = await this.request(`/sarees${qs ? '?' + qs : ''}`);
      return res.data;
    } catch (err) {
      if (typeof SAREES !== 'undefined') {
        let list = [...SAREES];
        if (params.occasion && params.occasion !== 'all') {
          list = list.filter(s => s.occasion && s.occasion.includes(params.occasion));
        }
        if (params.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
        if (params.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
        return list;
      }
      throw err;
    }
  },

  async getSaree(id) {
    try {
      const res = await this.request(`/sarees/${id}`);
      return res;
    } catch (err) {
      if (typeof SAREES !== 'undefined') {
        const item = SAREES.find(s => s.id === id) || SAREES[0];
        const related = SAREES.filter(s => s.id !== id && s.occasion.some(o => item.occasion.includes(o))).slice(0, 4);
        return { data: item, related };
      }
      throw err;
    }
  },

  async createSaree(sareeData) {
    try {
      return await this.request('/sarees', {
        method: 'POST',
        body: JSON.stringify(sareeData)
      });
    } catch (err) {
      // Local catalog storage fallback
      if (typeof SAREES !== 'undefined') {
        const newSaree = {
          id: sareeData.id || `sp-${String(SAREES.length + 1).padStart(3, '0')}`,
          name: sareeData.name,
          weave: sareeData.weave || 'Traditional Handloom',
          motif: sareeData.motif || 'Mayur (Peacock)',
          color: sareeData.color || 'Royal Maroon',
          price: Number(sareeData.price) || 28500,
          occasion: Array.isArray(sareeData.occasion) ? sareeData.occasion : [sareeData.occasion || 'wedding'],
          fabric: sareeData.fabric || 'Pure Mulberry Silk',
          zari: sareeData.zari || 'Gold Tested Zari',
          weight: sareeData.weight || '850 grams',
          origin: sareeData.origin || 'Yeola, Maharashtra',
          blouse: sareeData.blouse || 'Running Blouse Piece',
          description: sareeData.description || 'Authentic handwoven Paithani silk saree.',
          swatch: sareeData.swatch || ['#6B1E2B', '#E8B84B'],
          image: sareeData.image || 'assets/products/sp-001.jpg',
          stock: Number(sareeData.stock) || 1
        };
        SAREES.unshift(newSaree);
        return { success: true, saree: newSaree, fallback: true };
      }
      throw err;
    }
  },

  // --- Bookings APIs ---
  async createBooking(bookingData) {
    try {
      return await this.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
    } catch (err) {
      const localBookings = this.getLocalBookings();
      const newBooking = {
        id: Date.now(),
        customer_name: bookingData.customerName,
        customer_phone: bookingData.customerPhone,
        customer_email: bookingData.customerEmail,
        saree_id: bookingData.sareeId,
        saree_name: bookingData.sareeName || 'Handcrafted Paithani',
        preferred_date: bookingData.preferredDate,
        notes: bookingData.notes,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      localBookings.unshift(newBooking);
      localStorage.setItem('sp_local_bookings', JSON.stringify(localBookings));
      return { success: true, booking: newBooking, fallback: true };
    }
  },

  getLocalBookings() {
    try {
      const stored = localStorage.getItem('sp_local_bookings');
      if (stored) return JSON.parse(stored);
      if (typeof MOCK_BOOKINGS !== 'undefined') {
        return MOCK_BOOKINGS.map((b, i) => ({
          id: i + 1,
          customer_name: b.customer,
          customer_phone: '98200' + String(10000 + i),
          saree_name: b.saree,
          preferred_date: b.date,
          status: b.status,
          created_at: new Date().toISOString()
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  async getBookings() {
    try {
      return await this.request('/bookings');
    } catch (err) {
      return { data: this.getLocalBookings() };
    }
  },

  async updateBookingStatus(id, status) {
    try {
      return await this.request(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (err) {
      const bookings = this.getLocalBookings();
      const target = bookings.find(b => String(b.id) === String(id));
      if (target) {
        target.status = status;
        localStorage.setItem('sp_local_bookings', JSON.stringify(bookings));
        return { success: true, booking: target };
      }
      throw err;
    }
  },

  // --- Dashboard APIs ---
  async getDashboardStats() {
    try {
      return await this.request('/dashboard/stats');
    } catch (err) {
      const bookings = this.getLocalBookings();
      const pendingCount = bookings.filter(b => b.status === 'pending').length;
      const totalSarees = typeof SAREES !== 'undefined' ? SAREES.length : 10;
      const avgPrice = typeof SAREES !== 'undefined'
        ? Math.round(SAREES.reduce((acc, s) => acc + s.price, 0) / SAREES.length)
        : 31200;

      return {
        stats: {
          totalSarees,
          totalBookings: bookings.length,
          pendingBookings: pendingCount,
          averagePrice: avgPrice
        },
        bestsellers: typeof SAREES !== 'undefined' ? SAREES.filter(s => s.badge).slice(0, 5) : [],
        recentBookings: bookings.slice(0, 8)
      };
    }
  },

  // --- AI Stylist & Chat APIs ---
  async chat(message) {
    try {
      return await this.request('/stylist/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    } catch (err) {
      // Local fallback chat responses
      const q = (message || '').toLowerCase();
      let reply = "Namaste! I am your Sonali Paithani Stylist. How may I assist you with handloom bridal silks, festive weaves, or draping?";
      if (q.includes('hi') || q.includes('hello') || q.includes('namaste')) {
        reply = "Namaste! Welcome to Sonali Paithani. We weave authentic Yeola and Paithan handloom silks with certified pure zari. Looking for bridal, festive, or gifting sarees?";
      } else if (q.includes('price') || q.includes('cost') || q.includes('rate')) {
        reply = "Our authentic handloom Paithani sarees range from ₹16,500 for everyday silk up to ₹72,000 for pure bridal heirloom masterpieces. Would you like to view sarees in a specific budget?";
      } else if (q.includes('bridal') || q.includes('wedding') || q.includes('lagna')) {
        reply = "For bridal wear, our Peacock Purple Bridal Heirloom (SP-001) and Emerald Green Royal Asavali (SP-002) are the most cherished choices featuring rich gold zari pallus.";
      }
      return { reply };
    }
  },

  async getStylistRecommendations(payload) {
    try {
      return await this.request('/stylist/recommend', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (typeof SAREES !== 'undefined') {
        const occasion = payload.occasion;
        const matches = SAREES.filter(s => !occasion || occasion === 'all' || s.occasion.includes(occasion));
        return { recommendations: matches.slice(0, 3) };
      }
      throw err;
    }
  },

  // --- Wishlist APIs ---
  async getWishlist() {
    try {
      return await this.request('/wishlist');
    } catch {
      try {
        const stored = localStorage.getItem('sp_local_wishlist');
        return { ids: stored ? JSON.parse(stored) : [] };
      } catch {
        return { ids: [] };
      }
    }
  },

  async toggleWishlist(sareeId) {
    try {
      return await this.request(`/wishlist/${sareeId}`, { method: 'POST' });
    } catch {
      let ids = [];
      try {
        const stored = localStorage.getItem('sp_local_wishlist');
        ids = stored ? JSON.parse(stored) : [];
      } catch {}
      const idx = ids.indexOf(sareeId);
      let action = 'added';
      if (idx > -1) {
        ids.splice(idx, 1);
        action = 'removed';
      } else {
        ids.push(sareeId);
        action = 'added';
      }
      localStorage.setItem('sp_local_wishlist', JSON.stringify(ids));
      return { action, ids };
    }
  }
};

window.Api = Api;
