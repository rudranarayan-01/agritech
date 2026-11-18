import { router } from "expo-router";
import {
  ArrowRight,
  Leaf,
  Phone,
  ShieldCheck,
  Sprout,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const [mobile, setMobile] = useState("9876543210");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid 10-digit registered mobile number.",
      );
      return;
    }

    setLoading(true);
    try {
      await login(mobile);
      router.replace("/(tabs)" as any);
    } catch (err: any) {
      Alert.alert(
        "Sign In Failed",
        err.message || "Unable to connect. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-stone-100"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Top Earthy Agricultural Banner */}
        <View className="bg-emerald-800 pt-16 pb-20 px-6 rounded-b-[40px] shadow-sm relative overflow-hidden">
          {/* Subtle decorative background leaf */}
          <View className="absolute -right-8 -bottom-8 opacity-10">
            <Leaf size={180} color="#ffffff" />
          </View>

          <View className="flex-row items-center gap-3 mb-4">
            <View className="bg-emerald-700/90 p-3 rounded-2xl border border-emerald-600">
              <Sprout size={28} color="#fde047" />
            </View>
            <View>
              <Text className="text-emerald-200 text-xs font-bold uppercase tracking-widest">
                Smart Farming
              </Text>
              <Text className="text-white text-2xl font-extrabold tracking-tight">
                AgriTech
              </Text>
            </View>
          </View>

          <Text className="text-emerald-50 text-base leading-relaxed mt-2">
            AI crop diagnostics, real-time weather alerts, and personalized farm
            advisories in your pocket.
          </Text>
        </View>

        {/* Elevated Login Form Card */}
        <View className="px-6 -mt-12 flex-1 justify-between pb-8">
          <View className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <Text className="text-xl font-bold text-stone-900">
              Farmer Sign In
            </Text>
            <Text className="text-sm text-stone-500 mt-1 mb-6">
              Enter your registered mobile number to access your farm profile.
            </Text>

            {/* Mobile Input Field */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Mobile Number
              </Text>
              <View className="flex-row items-center bg-stone-50 border border-stone-300 rounded-2xl px-4 py-1 focus:border-emerald-600">
                <Phone size={18} color="#15803d" />
                <Text className="text-stone-700 font-semibold text-base ml-2.5 pr-2.5 border-r border-stone-300">
                  +91
                </Text>
                <TextInput
                  className="flex-1 py-3 px-3 text-stone-900 text-base font-medium tracking-wide"
                  placeholder="82603 48599"
                  placeholderTextColor="#a8a29e"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(text) =>
                    setMobile(text.replace(/[^0-9]/g, ""))
                  }
                />
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm ${
                loading
                  ? "bg-emerald-500"
                  : "bg-emerald-700 active:bg-emerald-800"
              }`}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text className="text-white font-bold text-base">
                    Continue to Farm
                  </Text>
                  <ArrowRight size={20} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Trust & Support Footer */}
          <View className="items-center mt-8 px-4">
            <View className="flex-row items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 mb-3">
              <ShieldCheck size={15} color="#15803d" />
              <Text className="text-emerald-800 text-xs font-medium">
                Verified Farmer Portal
              </Text>
            </View>
            <Text className="text-center text-xs text-stone-500 leading-5">
              Not registered yet? Contact your local block agriculture officer
              or Krishi Kendra to onboard your land profile.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
