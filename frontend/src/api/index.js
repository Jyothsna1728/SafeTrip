import api from './client';

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data?.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data?.data;
  },

  forgotPassword: async (data) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  verifyOtp: async (data) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data?.data?.valid;
  },

  resetPasswordOtp: async (data) => {
    const response = await api.post('/auth/reset-password-otp', data);
    return response.data;
  },

  validateResetToken: async (token) => {
    const response = await api.get('/auth/validate-reset-token', {
      params: { token }
    });
    return response.data?.data?.valid;
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data?.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data?.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data?.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  }
};

export const emergencyContactApi = {
  getEmergencyContact: async () => {
    const response = await api.get('/emergency-contact');
    return response.data?.data;
  },

  saveEmergencyContact: async (data) => {
    const response = await api.post('/emergency-contact', data);
    return response.data?.data;
  },

  updateEmergencyContact: async (data) => {
    const response = await api.put('/emergency-contact', data);
    return response.data?.data;
  },

  deleteEmergencyContact: async () => {
    const response = await api.delete('/emergency-contact');
    return response.data;
  }
};

export const tripsApi = {
  getTrips: async () => {
    const response = await api.get('/trips');
    return response.data?.data || [];
  },

  getTripById: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data?.data;
  },

  createTrip: async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data?.data;
  },

  updateTrip: async (id, tripData) => {
    const response = await api.put(`/trips/${id}`, tripData);
    return response.data?.data;
  },

  deleteTrip: async (id) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },

  addPlaceToTrip: async (tripId, placeDto) => {
    const response = await api.post(`/trips/${tripId}/places`, placeDto);
    return response.data?.data;
  },

  removePlaceFromTrip: async (tripId, placeId) => {
    const response = await api.delete(`/trips/${tripId}/places/${placeId}`);
    return response.data?.data;
  }
};

export const savedPlacesApi = {
  getSavedPlaces: async (category) => {
    const response = await api.get('/saved-places', {
      params: category ? { category } : {}
    });
    return response.data?.data || [];
  },

  savePlace: async (placeData) => {
    const response = await api.post('/saved-places', placeData);
    return response.data?.data;
  },

  removeSavedPlace: async (externalPlaceId) => {
    const response = await api.delete(`/saved-places/${externalPlaceId}`);
    return response.data;
  }
};

export const safetyApi = {
  createCheckin: async (checkinData) => {
    const response = await api.post('/checkins', checkinData);
    return response.data?.data;
  },

  getUserCheckins: async () => {
    const response = await api.get('/checkins');
    return response.data?.data || [];
  },

  notifyCheckinContact: async (checkinId, locationData) => {
    const endpoint = checkinId ? `/checkins/${checkinId}/notify` : '/checkins/notify';
    const response = await api.post(endpoint, locationData || {});
    return response.data;
  },

  notifyEmergencyAlert: async (alertData) => {
    const response = await api.post('/emergency/notify', alertData);
    return response.data;
  },

  createReport: async (reportData) => {
    const response = await api.post('/reports', reportData);
    return response.data?.data;
  },

  getActiveReports: async (params) => {
    const response = await api.get('/reports', {
      params: params || {}
    });
    return response.data?.data || [];
  },

  getUserReports: async () => {
    const response = await api.get('/reports/my');
    return response.data?.data || [];
  },

  deleteReport: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  }
};
export { placesApi } from './placesApi';
export const assistantApi = {
  sendMessage: async ({ message, destination, history }) => {
    const response = await api.post('/assistant/chat', {
      message,
      destination,
      history
    });
    return response.data?.data;
  }
};
