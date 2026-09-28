import api from './client';

export const placesApi = {
  // Geocode destination search
  geocodeDestination: async (text) => {
    const response = await api.get('/places/geocode', {
      params: { text }
    });
    return response.data?.data || [];
  },

  geocode: async (text) => {
    const response = await api.get('/places/geocode', {
      params: { text }
    });
    return response.data?.data || [];
  },

  // Reverse geocode latitude & longitude to obtain readable place name
  reverseGeocode: async (lat, lon) => {
    const response = await api.get('/places/reverse-geocode', {
      params: { lat, lon }
    });
    return response.data?.data;
  },

  // Get nearby places around explore coordinates
  getNearbyPlaces: async ({ lat, lon, category = 'all', radius = 15000, limit = 35, minRating, amenity, sort }) => {
    const params = { lat, lon, category, radius, limit };
    if (minRating) params.minRating = minRating;
    if (amenity) params.amenity = amenity;
    if (sort) params.sort = sort;

    const response = await api.get('/places/nearby', { params });
    return response.data?.data || [];
  },

  nearby: async (params) => {
    const response = await api.get('/places/nearby', { params });
    return response.data?.data || [];
  },

  search: async (params) => {
    const response = await api.get('/places/search', { params });
    return response.data?.data || [];
  },

  // Get single place details
  getPlaceDetails: async (id) => {
    const response = await api.get(`/places/${id}`);
    return response.data?.data;
  },

  getById: async (id) => {
    const response = await api.get(`/places/${id}`);
    return response.data?.data;
  },
};
