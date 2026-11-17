import { logger } from "@rudranarayan01/logaccent";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Inject Token & Log Request Details
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("farmer_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.error("SecureStore Error:", error);
    }

    // 🔍 LOG OUTGOING REQUEST
    logger.info("[API REQUEST]", {
      url: `${config.baseURL}${config.url}`,
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error) => {
    logger.error("[API REQUEST ERROR]", error);
    return Promise.reject(error);
  },
);

// Response Interceptor: Log Errors from Server
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error("[API RESPONSE ERROR]", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  },
);
