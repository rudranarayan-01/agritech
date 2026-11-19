import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnimatedSplashScreen from "../../components/AnimatedSplashScreen";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";

    if (!token && !inAuthGroup) {
      router.replace("/login" as any);
    } else if (token && inAuthGroup) {
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
        <View className="flex-1 bg-white">
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
