import axios from "axios";

const API = axios.create({
  baseURL: "https://tv-tracker-muie.onrender.com",
});

// Add token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // 👈 here
  }
  return config;
});

export default API;
