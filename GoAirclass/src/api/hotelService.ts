import apiClient from './apiClient';

export interface HotelSearchParams {
  locationId?: string;
  city?: string;
  checkIn: string;
  checkOut: string;
  rooms?: number;
  guests?: number;
}

export const hotelService = {
  getLocations: async (query?: string) => {
    const response = await apiClient.get('/hotels/locations', { params: { query } });
    return response.data;
  },

  searchHotelsByLocation: async (params: HotelSearchParams) => {
    const response = await apiClient.get('/hotels/search-by-location', { params });
    return response.data;
  },

  getHotelDetails: async (hotelId: string, params: { cityName: string; checkIn: string; checkOut: string; guests?: number; rooms?: number }) => {
    const response = await apiClient.get(`/hotels/details/${hotelId}`, { params });
    return response.data;
  },

  searchHotelsByIds: async (data: { hotelIds: string[]; checkIn: string; checkOut: string; rooms?: number; guests?: number }) => {
    const response = await apiClient.post('/hotels/search', data);
    return response.data;
  },

  provisionalBook: async (data: {
    hotelId: string;
    searchId: string;
    bookingCode: string;
    bookingAmount: number;
    checkIn: string;
    checkOut: string;
    rooms?: number;
    guests?: number;
    title?: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    specialRequests?: string;
  }) => {
    const response = await apiClient.post('/hotels/provisional-book', data);
    return response.data;
  },

  createPaymentOrder: async (data: { amount: number; notes: any }) => {
    const response = await apiClient.post('/payments/create-order', data);
    return response.data;
  },

  confirmBook: async (data: {
    provisionalBookId: string;
    hotelId: string;
    hotelName: string;
    roomName: string;
    guestName: string;
    totalAmount: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const response = await apiClient.post('/hotels/confirm-book', data);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await apiClient.get('/hotels/my-bookings');
    return response.data;
  },

  getTripDetails: async (tripId: string) => {
    const response = await apiClient.get(`/hotels/trip/${tripId}`);
    return response.data;
  },

  downloadReceipt: async (tripId: string) => {
    const response = await apiClient.post(`/hotels/trip/${tripId}/download-receipt`);
    return response.data;
  },

  getRefundInfo: async (tripId: string) => {
    const response = await apiClient.get(`/hotels/refund-info/${tripId}`);
    return response.data;
  },

  cancelBooking: async (tripId: string) => {
    const response = await apiClient.post('/hotels/cancel-booking', { tripId });
    return response.data;
  },
};

export default hotelService;
