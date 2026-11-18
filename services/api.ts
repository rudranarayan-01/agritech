import { accent, logger } from "@rudranarayan01/logaccent";
import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

// Request Interceptor: Inject Access Token & Log Request Details
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("farmer_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.error("SecureStore Read Error:", error);
    }

    // 🔍 LOG OUTGOING REQUEST
    logger.info(
      accent.green("[API REQUEST]", {
        url: `${config.baseURL}${config.url}`,
        method: config.method?.toUpperCase(),
        data: config.data,
      }),
    );

    return config;
  },
  (error) => {
    logger.error("[API REQUEST ERROR]", error);
    return Promise.reject(error);
  },
);

// Queue variables to handle concurrent expired requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};

// Response Interceptor: Handle Errors & Token Rotation
apiClient.interceptors.response.use(
  (response) => {
    logger.info(
      accent.cyan("[API RESPONSE SUCCESS]", {
        url: response.config.url,
        status: response.status,
      }),
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED";

    // 🚫 SKIP logging an error for expected token expiration
    if (!isTokenExpired) {
      logger.error("[API RESPONSE ERROR]", {
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      logger.info(
        accent.yellow(
          "[AUTH] Access token expired. Rotating token silently...",
        ),
      );
    }

    // Check if error is due to an expired access token and we haven't tried retrying yet
    if (isTokenExpired && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(
          "farmer_refresh_token",
        );
        if (!refreshToken) {
          throw new Error("No refresh token available in SecureStore");
        }

        // Use standard axios to prevent infinite looping through apiClient interceptors
        const response = await axios.post(`${API_URL}/farmers/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        // Persist the newly rotated token pair
        await SecureStore.setItemAsync("farmer_token", newAccessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync(
            "farmer_refresh_token",
            newRefreshToken,
          );
        }

        logger.info(
          accent.green(
            "[AUTH] Token refresh successful. Retrying original request.",
          ),
        );

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        logger.error(
          "[AUTH] Refresh token failed or expired. Forcing logout.",
          refreshError.message,
        );

        // Wipe session from SecureStore
        await SecureStore.deleteItemAsync("farmer_token");
        await SecureStore.deleteItemAsync("farmer_refresh_token");

        // Redirect user back to login screen
        router.replace("/login" as any);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
