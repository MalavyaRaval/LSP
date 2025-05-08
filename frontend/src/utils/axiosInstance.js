import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://lsp-backend.onrender.com",
  withCredentials: true,
});

export default axiosInstance;
