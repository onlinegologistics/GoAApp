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
  page?: number;
  limit?: number;
  stops?: string;
  airlines?: string[];
  fareType?: string;
  maxPrice?: number;
  depTimeBucket?: string;
  arrTimeBucket?: string;
}

export const flightService = {
  searchFlights: async (params: FlightSearchParams) => {
    const response = await apiClient.post('/flights/search', params);
    return response.data;
  },

  login: async () => {
    const response = await apiClient.post('/flights/login');
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
    const response = await apiClient.get(`/flights/my-bookings?t=${Date.now()}`);
    return response.data;
  },

  getBulkBenefits: async (data: { dataId: string; fareIds: string[]; sessionId?: string; searchId?: string }) => {
    const response = await apiClient.post('/flights/benefits/bulk', data);
    return response.data;
  },

  createSession: async (searchId: string) => {
    const response = await apiClient.post('/flights/session', { searchId });
    return response.data;
  },

  flightPreview: async (data: any) => {
    const response = await apiClient.post('/flights/preview', data);
    return response.data;
  },

  fetchAncillaries: async (data: any) => {
    const response = await apiClient.post('/flights/fetch-ancillaries', data);
    return response.data;
  },

  holdFlight: async (data: any) => {
    const response = await apiClient.post('/flights/hold', data);
    return response.data;
  },

  bookFlight: async (data: any) => {
    const response = await apiClient.post('/flights/book', data);
    return response.data;
  },

  getCancelReasons: async (tripId: string) => {
    const response = await apiClient.get(`/flights/cancel-reasons/${tripId}`);
    return response.data;
  },

  cancelFlight: async (bookingId: string, reasonCode: string, remarks?: string) => {
    const response = await apiClient.post('/flights/cancel', { bookingId, reasonCode, remarks });
    return response.data;
  },

  getCancelRefundInfo: async (tripId: string, reasonCode: string, bookingInfoSequence: string = '1') => {
    const response = await apiClient.get(`/flights/cancel-refund-info/${tripId}/${reasonCode}`, {
      params: { bookingInfoSequence }
    });
    return response.data;
  },

  getRefundInfo: async (tripId: string) => {
    const response = await apiClient.get(`/flights/refund-info/${tripId}`);
    return response.data;
  },
};

export default flightService;
