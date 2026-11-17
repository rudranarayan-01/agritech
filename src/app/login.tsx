import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      Alert.alert(
        "Invalid Mobile",
        "Please enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    setLoading(true);
    try {
      await login(mobile);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 justify-center px-6">
      <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <View className="mb-6">
          <Text className="text-2xl font-extrabold text-slate-900">
            AgriTech Portal
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
            Sign in using your registered mobile number.
          </Text>
        </View>

        <View className="space-y-4 mb-6">
          <View>
            <Text className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number
            </Text>
            <TextInput
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-base"
              placeholder="e.g., 8260348599"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
            />
          </View>
        </View>

        <TouchableOpacity
          className={`w-full py-3.5 rounded-xl items-center shadow transition-all ${
            loading ? "bg-emerald-400" : "bg-emerald-600 active:bg-emerald-700"
          }`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
