import apiClient from './apiClient';

export interface FlightSearchParams {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  passengers?: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass?: string;
}

export const flightService = {
  searchFlights: async (params: FlightSearchParams) => {
    const response = await apiClient.post('/flights/search', params);
    return response.data;
  },

  searchAirports: async (query: string) => {
    const response = await apiClient.get('/flights/airports/search', {
      params: { query },
    });
    return response.data;
  },

  getFareCalendar: async (from: string, to: string, month: string) => {
    const response = await apiClient.post('/flights/fare-calendar', { from, to, month });
    return response.data;
  },

  getTripDetails: async (tripId: string) => {
    const response = await apiClient.get(`/flights/trip/${tripId}`);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await apiClient.get('/flights/my-bookings');
    return response.data;
  },
};

export default flightService;
