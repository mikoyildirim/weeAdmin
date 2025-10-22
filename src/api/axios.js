import axios from "axios";
import { store } from "../store/store";

// const instance = axios.create({
//   baseURL: "https://app.weedevices.com/api/v1",
//   headers: {
//     "Content-Type": "application/json",
//     language: "tr",
//     version: "panel",
//   },
// });

const instance = axios.create({
  baseURL: "http://192.168.1.112:8082/api/v1/",
  headers: {
    "Content-Type": "application/json",
    language: "tr",
    version: "panel",
  },
});

instance.interceptors.request.use((config) => {
  const token = store.getState().user.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
