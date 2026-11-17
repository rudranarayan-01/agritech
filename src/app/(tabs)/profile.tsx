import { router } from "expo-router";
import {
  ChevronRight,
  Database,
  LogOut,
  MapPin,
  User,
} from "lucide-react-native";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout, farmer } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your farm profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login" as any);
          },
        },
      ],
    );
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-slate-50">
      <View className="bg-white px-5 pt-4 pb-6 border-b border-emerald-100 items-center">
        <View className="w-20 h-20 bg-emerald-600 rounded-full items-center justify-center mb-3 shadow-sm">
          <User size={36} color="#ffffff" />
        </View>
        <Text className="text-lg font-extrabold text-slate-900">
          Rudranarayan Sahu
        </Text>
        <Text className="text-xs text-emerald-700 font-medium">
          Lead Agronomist & Developer
        </Text>
      </View>

      <View className="p-5 gap-4">
        <View className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">
          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-slate-100">
            <View className="flex-row items-center gap-3">
              <MapPin size={20} color="#059669" />
              <Text className="text-slate-900 font-bold text-sm">
                Farm Location: Bhubaneswar
              </Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Database size={20} color="#059669" />
              <Text className="text-slate-900 font-bold text-sm">
                TensorFlow Model Status: Connected
              </Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 p-4 rounded-2xl border border-red-200 flex-row items-center justify-center gap-2"
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#dc2626" />
          <Text className="text-red-700 font-bold text-sm">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
