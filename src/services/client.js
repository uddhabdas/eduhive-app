import axios from 'axios';
import { Platform } from 'react-native';

function getBaseURL() {
  const PRODUCTION_URL = 'https://eduhive-server.onrender.com';
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  return PRODUCTION_URL;
}

export const api = axios.create({
  baseURL: getBaseURL(),
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}