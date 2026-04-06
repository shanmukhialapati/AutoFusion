import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// 1. Define the User interface
interface UserData {
  token: string;
}

// 2. Define the Context interface with setAuth
interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  setAuth: (userData: UserData | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from storage on app startup
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          setUser({ token });
        }
      } catch (error) {
        console.error("Failed to load token", error);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  // 3. Define setAuth to handle both login state and persistence
  const setAuth = async (userData: UserData | null) => {
    if (userData) {
      // Save token and update state
      await AsyncStorage.setItem("token", userData.token);
      setUser(userData);
    } else {
      // Remove token and clear state (Logout)
      await AsyncStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing auth state
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
