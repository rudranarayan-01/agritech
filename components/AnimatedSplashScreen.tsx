import { Cpu } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Text, View } from "react-native";

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplashScreen({
  onAnimationComplete,
}: AnimatedSplashScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [statusText, setStatusText] = useState("Initializing Core Services...");

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
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
      () => setStatusText("Loading Vision & Disease Models..."),
      550,
    );
    const t2 = setTimeout(
      () => setStatusText("Syncing Regional Telemetry..."),
      1150,
    );
    const t3 = setTimeout(() => setStatusText("Ready"), 1700);

    const finishTimer = setTimeout(() => {
      onAnimationComplete();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <View className="absolute inset-0 w-full h-full bg-white flex-col items-center justify-between px-6 py-20">
      {/* Top Enterprise Metadata */}
      <View></View>
      {/* Center Branded App Icon & Typography */}
      <View className="w-full items-center justify-center">
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {/* Custom App Icon Container with Depth Shadow & Subtle Border */}
          <View className="w-32 h-32 rounded-[32px] bg-white border border-emerald-100 shadow-xl shadow-emerald-950/10 items-center justify-center overflow-hidden p-3">
            <Image
              source={require("../assets/icon.png")}
              className="w-full h-full rounded-2xl"
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View className="items-center mt-8">
            <Text className="text-3xl font-black text-slate-900 tracking-wider uppercase text-center">
              agritech
            </Text>
            <Text className="text-emerald-700 text-[11px] mt-1.5 tracking-[0.2em] font-extrabold uppercase text-center">
              Crop Health Intelligence
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Progress & Status Module */}
      <View className="w-full items-center">
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="w-64 items-center">
            <View className="flex-row items-center justify-center gap-2 mb-3">
              <Cpu size={13} color="#059669" />
              <Text className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                {statusText}
              </Text>
            </View>

            <View className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <Animated.View
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#059669",
                  transform: [
                    {
                      translateX: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-256, 0],
                      }),
                    },
                  ],
                }}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
