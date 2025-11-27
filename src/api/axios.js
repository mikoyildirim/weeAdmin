import axios from "axios";
import { store } from "../redux/store"
import { logout } from "../redux/slices/authSlice";
import { message } from "antd";


//const baseURL= "https://app.weedevices.com/api/v1"
const baseURL= "http://192.168.1.112:8082/api/v1/"


const instance = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
    language: "tr",
    version: "panel",
  },
});


instance.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  //console.log("Axios Token:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

instance.interceptors.response.use(   // eğer token geçerliliğini yitirdiyse backend status 401 dönecektir. Bu noktada burada login sayfasına yönlendirme işlemi yapılıyor.
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      message.error("Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.");
      store.dispatch(logout()); // varsa tokenı temizle
    }

    return Promise.reject(error);
  }
);


export default instance;
