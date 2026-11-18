import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../services/api";

interface FarmerData {
  farmerId: string;
  name: string;
  mobile: string;
  village: string;
  district: string;
}

interface AuthContextType {
  token: string | null;
  farmer: FarmerData | null;
  isLoading: boolean;
  login: (mobile: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [farmer, setFarmer] = useState<FarmerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session on app startup
    const loadStoredAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("farmer_token");
        const storedFarmer = await SecureStore.getItemAsync("farmer_data");

        if (storedToken && storedFarmer) {
          setToken(storedToken);
          setFarmer(JSON.parse(storedFarmer));
        }
      } catch (error) {
        console.error("Failed to load auth state", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (mobile: string) => {
    try {
      const response = await apiClient.post("/farmers/login", { mobile });

      // Expecting { accessToken, refreshToken, data } from our updated backend controller
      const { accessToken, refreshToken, data } = response.data;

      // Save access token, refresh token, and farmer metadata securely
      await SecureStore.setItemAsync("farmer_token", accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync("farmer_refresh_token", refreshToken);
      }
      await SecureStore.setItemAsync("farmer_data", JSON.stringify(data));

      setToken(accessToken);
      setFarmer(data);
    } catch (error: any) {
      console.log(error);
      throw new Error(
        error.response?.data?.message ||
          "Login failed. Please check your mobile number.",
      );
    }
  };

  const logout = async () => {
    try {
      // Optional: Call backend logout to wipe refreshTokenHash from MongoDB
      try {
        await apiClient.post("/farmers/logout");
      } catch (err) {
        // Ignore network errors on logout, proceed to clear local store
      }

      // Clear all secure storage entries
      await SecureStore.deleteItemAsync("farmer_token");
      await SecureStore.deleteItemAsync("farmer_refresh_token");
      await SecureStore.deleteItemAsync("farmer_data");

      setToken(null);
      setFarmer(null);
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, farmer, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
