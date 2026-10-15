import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  withCredentials: true // Crucial for sending & receiving HttpOnly cookies
});

export default API;
