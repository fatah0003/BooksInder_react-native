import axios from 'axios';

const API_URL = 'http://192.168.1.115:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  getBooks: async () => {
    const response = await apiClient.get('/books');
    return response.data;
  },
};

export default apiClient;
