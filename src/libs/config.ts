// API Configuration
const API_BACKEND = process.env.NEXT_PUBLIC_API_BACKEND || 'fastapi';

const API_URLS = {
  django: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000',
  fastapi: process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:9000',
};

export const API_BASE_URL = API_URLS[API_BACKEND as keyof typeof API_URLS];

// API Endpoints
export const API_ENDPOINTS = {
  // Django endpoints
  django: {
    register: '/user/api/register/',
    login: '/user/api/login/',
    logout: '/user/api/logout/',
    profile: '/user/api/profile/',
    changePassword: '/user/api/change-password/',
    deleteAccount: '/user/api/delete-account/',
    refreshToken: '/user/api/token/refresh/',
  },
  // FastAPI endpoints
  fastapi: {
    register: '/api/register/',
    login: '/api/login/',
    logout: '/api/logout/',
    profile: '/api/profile/',
    changePassword: '/api/change-password/',
    deleteAccount: '/api/delete-account/',
    refreshToken: '/api/token/refresh/',
  },
};

export const ENDPOINTS = API_ENDPOINTS[API_BACKEND as keyof typeof API_ENDPOINTS];

export default {
  API_BASE_URL,
  ENDPOINTS,
  API_BACKEND,
};
