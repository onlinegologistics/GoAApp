import axios from 'axios';
import { Platform } from 'react-native';

// Safely obtain environment URL from @env or fallback
let envApiUrl = '';
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const env = require('@env');
  envApiUrl = env.API_URL || env.BASE_URL || '';
} catch (e) {
  // @ts-ignore
  envApiUrl = typeof process !== 'undefined' && process.env ? process.env.API_URL || '' : '';
}

const getBaseUrl = () => {
  if (envApiUrl && envApiUrl.trim().length > 0) {
    return envApiUrl;
  }
  return 'http://localhost:5001/api';
};

export const BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';

let authToken: string | null = null;

export const getAuthToken = () => authToken;

export const setAuthToken = async (token: string | null) => {
  authToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem('authToken', token);
    } else {
      await AsyncStorage.removeItem('authToken');
    }
  } catch (err) {
    console.error('AsyncStorage error:', err);
  }
};

apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`[Axios ${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorMsg = error?.response?.data?.message || error?.message || 'Network Error';
    console.error(`[Axios Error] ${error.config?.url}:`, errorMsg);
    return Promise.reject(error);
  }
);

export default apiClient;
