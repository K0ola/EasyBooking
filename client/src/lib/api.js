const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP Error ${response.status}`
    }));
    throw new Error(errorData.error || `HTTP Error: ${response.status}`);
  }
  return response.json();
};

// Auth API
export const authAPI = {
  register: async (email, password, fullName) => {
    try {
      console.log('📝 [API] Registering user:', email);
      console.log('🌐 [API] URL:', `${API_URL}/api/auth/register`);

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      console.log('📡 [API] Register response status:', response.status);
      const result = await handleResponse(response);
      console.log('✅ [API] Register successful');
      return result;
    } catch (error) {
      console.error('❌ [API Error] register:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      console.log('🔑 [API] Logging in user:', email);
      console.log('🌐 [API] URL:', `${API_URL}/api/auth/login`);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 [API] Login response status:', response.status);
      const result = await handleResponse(response);
      console.log('✅ [API] Login successful');
      return result;
    } catch (error) {
      console.error('❌ [API Error] login:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (logout):', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      console.log('👤 [API] Fetching user profile');
      console.log('🌐 [API] URL:', `${API_URL}/api/auth/profile`);
      console.log('🔑 [API] Headers:', getAuthHeaders());

      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: getAuthHeaders(),
      });

      console.log('📡 [API] Profile response status:', response.status);
      const result = await handleResponse(response);
      console.log('✅ [API] Profile fetched successfully');
      return result;
    } catch (error) {
      console.error('❌ [API Error] getProfile:', error);
      throw error;
    }
  },
};

// Rooms API
export const roomsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (rooms.getAll):', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${id}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (rooms.getById):', error);
      throw error;
    }
  },

  getAvailability: async (id, date) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${id}/availability?date=${date}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (rooms.getAvailability):', error);
      throw error;
    }
  },
};

// Bookings API
export const bookingsAPI = {
  getMyBookings: async () => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/my-bookings`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (bookings.getMyBookings):', error);
      throw error;
    }
  },

  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_URL}/api/bookings?${params}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (bookings.getAll):', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (bookings.getById):', error);
      throw error;
    }
  },

  create: async (bookingData) => {
    try {
      console.log('🚀 [API] Creating booking with data:', bookingData);
      console.log('🌐 [API] API URL:', `${API_URL}/api/bookings`);
      console.log('🔑 [API] Auth headers:', getAuthHeaders());

      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bookingData),
      });

      console.log('📡 [API] Response status:', response.status);
      console.log('📡 [API] Response ok:', response.ok);

      const result = await handleResponse(response);
      console.log('✅ [API] Booking created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ [API Error] bookings.create:', error);
      console.error('❌ [API Error] Error details:', error.message);
      throw error;
    }
  },

  update: async (id, bookingData) => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(bookingData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (bookings.update):', error);
      throw error;
    }
  },

  cancel: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API Error (bookings.cancel):', error);
      throw error;
    }
  },
};
