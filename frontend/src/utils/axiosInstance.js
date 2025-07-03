import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://lsp-backend.onrender.com',
});

export default axiosInstance;
