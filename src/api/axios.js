import axios from "axios";

const instance = axios.create({
  baseURL: "http://192.168.1.55:8082/api/v1/", // backend adresin
  headers: {
    "Content-Type": "application/json",
    language: "tr",
    version: "panel",
  },
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
