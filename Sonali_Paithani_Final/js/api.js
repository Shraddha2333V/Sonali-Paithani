/**
 * SONALI PAITHANI — API Client
 * Seamlessly connects the frontend to the Express backend.
 * Includes graceful fallbacks to data.js if the backend is ever offline.
 */

const API_BASE = window.SONALI_API_URL || 'http://localhost:5000/api';

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

  // Helper fetch with auth header
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

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[Api] Error on ${endpoint}:`, err.message);
      throw err;
    }
  },

  // --- Auth APIs ---
  async login(loginId, password, expectedRole) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password, expectedRole })
    });
    if (res.token && res.user) {
      this.setToken(res.token);
      this.setUser(res.user);
    }
    return res;
  },

  async signup(payload) {
    const res = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token && res.user) {
      this.setToken(res.token);
      this.setUser(res.user);
    }
    return res;
  },

  async getMe() {
    const res = await this.request('/auth/me');
    if (res.user) this.setUser(res.user);
    return res.user;
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
      // Fallback to local SAREES if backend is unreachable
      if (typeof SAREES !== 'undefined') {
        console.info('[Api] Using local fallback catalog');
        return SAREES;
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

  // --- Bookings APIs ---
  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  },

  async getBookings() {
    return this.request('/bookings');
  },

  async updateBookingStatus(id, status) {
    return this.request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // --- Dashboard APIs ---
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  },

  // --- AI Stylist & Chat APIs ---
  async chat(message) {
    return this.request('/stylist/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  async getStylistRecommendations(payload) {
    return this.request('/stylist/recommend', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // --- Wishlist APIs ---
  async getWishlist() {
    return this.request('/wishlist');
  },

  async toggleWishlist(sareeId) {
    return this.request(`/wishlist/${sareeId}`, {
      method: 'POST'
    });
  }
};

window.Api = Api;
