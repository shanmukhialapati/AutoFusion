import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// 🔹 Base URLs for different services
const ORDER_BASE_URL = "http://192.168.0.225:8080/api";
const BASE_URL = "http://192.168.0.223:8080/api";
const CATEGORY_BASE_URL = "http://192.168.0.177:8080/api";
const CART_URL = "http://192.168.0.225:8080/api";

export const mainApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const categoryApi = axios.create({
  baseURL: CATEGORY_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
export const cartApi = axios.create({
  baseURL: CART_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const orderApi = axios.create({
  baseURL: ORDER_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Common interceptor function
const attachToken = (instance: any) => {
  instance.interceptors.request.use(
    async (config: any) => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Token error:", error);
      }
      return config;
    },
    (error: any) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      console.error("API Error:", error?.response?.data || error.message);
      return Promise.reject(error);
    },
  );
};

// 🔹 Attach interceptors to all instances
attachToken(mainApi);
attachToken(categoryApi);
attachToken(orderApi);
attachToken(cartApi);

// 🔹 Export default (optional)
export default mainApi;
