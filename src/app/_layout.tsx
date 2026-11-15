import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnimatedSplashScreen from "../../components/AnimatedSplashScreen";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <View className="flex-1 w-full h-full bg-white">
        <Slot />
        {!isAppReady && (
          <AnimatedSplashScreen
            onAnimationComplete={() => setIsAppReady(true)}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}
