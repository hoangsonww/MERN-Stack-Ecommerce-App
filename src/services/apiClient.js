import axios from 'axios';

const resolveBaseURL = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (process.env.REACT_APP_API_USE_PROXY === 'true') {
    return '/api';
  }

  return 'https://fusion-electronics-api.vercel.app/api';
};

export const API_BASE_URL = resolveBaseURL();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export async function withRetry(request, { retries = 2, delay = 400 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) {
        throw error;
      }
      lastError = error;
      if (attempt === retries) break;
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  throw lastError;
}
