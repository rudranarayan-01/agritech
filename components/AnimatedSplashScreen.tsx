import { Cpu, ShieldCheck, Sprout } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplashScreen({
  onAnimationComplete,
}: AnimatedSplashScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [statusText, setStatusText] = useState("Initializing Crop Engine...");

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const t1 = setTimeout(
      () => setStatusText("Loading Disease Vision Models..."),
      600,
    );
    const t2 = setTimeout(
      () => setStatusText("Syncing Weather & Soil Telemetry..."),
      1200,
    );
    const t3 = setTimeout(() => setStatusText("Ready"), 1750);

    const finishTimer = setTimeout(() => {
      onAnimationComplete();
    }, 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <View className="absolute inset-0 w-full h-full bg-white flex-col items-center justify-between px-6 py-16">
      {/* Top Enterprise Badge */}
      <View className="w-full items-center">
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="flex-row items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
            <ShieldCheck size={14} color="#059669" />
            <Text className="text-emerald-800 text-xs font-bold tracking-wider uppercase">
              Smart Crop Intelligence
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Center Logo & Brand */}
      <View className="w-full items-center justify-center">
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View className="w-32 h-32 rounded-3xl bg-emerald-50 border border-emerald-200 items-center justify-center">
            <View className="w-20 h-20 bg-emerald-600 rounded-2xl items-center justify-center shadow-sm">
              <Sprout size={42} color="#ffffff" />
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View className="items-center mt-8">
            <Text className="text-4xl font-black text-slate-900 tracking-widest uppercase text-center">
              agritech
            </Text>
            <Text className="text-emerald-700 text-xs mt-2 tracking-widest font-bold uppercase text-center">
              Crop Diagnostics & Advisory
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Progress Bar */}
      <View className="w-full items-center">
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="w-72 items-center">
            <View className="flex-row items-center justify-center gap-2 mb-3">
              <Cpu size={14} color="#059669" />
              <Text className="text-slate-600 text-xs font-medium uppercase tracking-wider">
                {statusText}
              </Text>
            </View>

            <View className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
              <Animated.View
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#059669",
                  transform: [{ scaleX: progressAnim }],
                }}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
