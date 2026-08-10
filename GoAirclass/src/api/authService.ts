import apiClient, { setAuthToken } from './apiClient';

export interface SendOtpPayload {
  mobileNumber?: string;
  email?: string;
}

export interface VerifyOtpPayload {
  mobileNumber?: string;
  email?: string;
  otp: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  mobileNumber: string;
}

export const authService = {
  // Send OTP for Guest/User Login
  sendLoginOtp: async (mobileNumber: string) => {
    const response = await apiClient.post('/auth/send-otp', { mobileNumber });
    return response.data;
  },

  // Verify Login OTP
  verifyLoginOtp: async (mobileNumber: string, otp: string) => {
    const response = await apiClient.post('/auth/verify-login-otp', { mobileNumber, otp });
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  // Send OTP for Registration
  sendRegistrationOtp: async (payload: RegisterPayload) => {
    const response = await apiClient.post('/auth/register/send-otp', payload);
    return response.data;
  },

  // Verify Registration OTP
  verifyRegistrationOtp: async (payload: { fullName: string; email: string; mobileNumber: string; otp: string; password?: string }) => {
    const response = await apiClient.post('/auth/register/verify-otp', payload);
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  // Email OTP Login
  sendEmailLoginOtp: async (email: string) => {
    const response = await apiClient.post('/auth/login/send-otp', { email });
    return response.data;
  },

  // Verify Email Login OTP
  verifyEmailLoginOtp: async (email: string, otp: string) => {
    const response = await apiClient.post('/auth/login/verify-otp', { email, otp });
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset Password
  resetPassword: async (payload: { email: string; otp: string; newPassword: string }) => {
    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  },
};

export default authService;
