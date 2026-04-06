import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// 🔹 Base URLs for different services
const BASE_URL = "http://192.168.0.203:8080/api";
const CATEGORY_BASE_URL = "http://192.168.0.157:8080/api";

// 🔹 Create axios instances
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

  // 🔹 Optional: Response interceptor (better debugging)
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

// 🔹 Export default (optional)
export default mainApi;
