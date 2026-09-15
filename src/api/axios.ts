import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Sesuaikan port backend kamu
});

// Interceptor untuk menyisipkan Bearer Token otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
