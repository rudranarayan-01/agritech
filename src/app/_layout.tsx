import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnimatedSplashScreen from "../../components/AnimatedSplashScreen"; // Adjust path based on your root folder if needed
import { AuthProvider, useAuth } from "../../context/AuthContext";
import "../global.css";

SplashScreen.preventAutoHideAsync();

// Inner component that handles route redirection based on auth state
function RootNavigator() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated and not already on login screen
      router.replace("/login");
    } else if (token && inAuthGroup) {
      // Redirect to main tabs if already logged in and trying to access login
      router.replace("/(tabs)" as any);
    }
  }, [token, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View className="flex-1 w-full h-full bg-white">
          <RootNavigator />
          {!isAppReady && (
            <AnimatedSplashScreen
              onAnimationComplete={() => setIsAppReady(true)}
            />
          )}
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
