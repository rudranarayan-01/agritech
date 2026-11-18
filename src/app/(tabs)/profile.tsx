import { router } from "expo-router";
import {
  Droplets,
  Globe,
  Layers,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sprout,
  User,
  Wrench,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { apiClient } from "../../../services/api";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/farmers/profile");
      if (response.data?.success) {
        setProfile(response.data.data);
      }
    } catch (error: any) {
      console.error(
        "Fetch Profile Error:",
        error.response?.data || error.message,
      );
      Alert.alert("Error", "Unable to load farmer profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your farm account?",
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

  if (loading) {
    return (
      <View className="flex-1 bg-stone-100 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50">
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View className="px-5 pt-12 pb-4 bg-white border-b border-stone-200 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-extrabold text-stone-900 tracking-tight">
            Farmer Dashboard
          </Text>
          <Text className="text-xs text-stone-500 font-medium mt-0.5">
            Registered Agronomic Profile
          </Text>
        </View>
        <View className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex-row items-center gap-1.5">
          <ShieldCheck size={14} color="#047857" />
          <Text className="text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Verified
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Identity Card */}
        <View className="bg-emerald-900 rounded-3xl p-6 shadow-sm overflow-hidden relative">
          <View className="absolute -right-6 -bottom-6 opacity-10">
            <Sprout size={140} color="#ffffff" />
          </View>

          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 bg-emerald-800 rounded-2xl items-center justify-center border border-emerald-600 shadow-inner">
              <User size={28} color="#a7f3d0" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-extrabold tracking-tight">
                {profile?.name || "Farmer"}
              </Text>
              <Text className="text-emerald-200 text-xs font-mono mt-0.5 opacity-90">
                {profile?.farmerId}
              </Text>
            </View>
          </View>

          <View className="mt-5 pt-4 border-t border-emerald-800/80 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
              <MapPin size={14} color="#34d399" />
              <Text
                className="text-emerald-100 text-xs font-medium"
                numberOfLines={1}
              >
                {profile?.village}, {profile?.district} ({profile?.state})
              </Text>
            </View>
            <View className="bg-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-700">
              <Text className="text-emerald-200 text-[10px] font-bold uppercase">
                {profile?.gender}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Farm Land & Agronomic Stats Grid */}
        <View className="gap-3">
          <Text className="text-stone-900 font-extrabold text-sm uppercase tracking-wider px-1">
            Land & Soil Metrics
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white p-4 rounded-2xl border border-stone-200 gap-1 shadow-sm">
              <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center mb-1">
                <Layers size={16} color="#059669" />
              </View>
              <Text className="text-stone-400 text-[10px] font-bold uppercase">
                Total Land
              </Text>
              <Text className="text-stone-900 font-extrabold text-lg">
                {profile?.totalLandArea}{" "}
                <Text className="text-xs font-normal text-stone-500">
                  {profile?.landUnit}
                </Text>
              </Text>
            </View>

            <View className="flex-1 bg-white p-4 rounded-2xl border border-stone-200 gap-1 shadow-sm">
              <View className="w-8 h-8 rounded-xl bg-amber-50 items-center justify-center mb-1">
                <Wrench size={16} color="#d97706" />
              </View>
              <Text className="text-stone-400 text-[10px] font-bold uppercase">
                Soil Type
              </Text>
              <Text
                className="text-stone-900 font-extrabold text-base capitalize"
                numberOfLines={1}
              >
                {profile?.soilType} Soil
              </Text>
            </View>
          </View>

          <View className="bg-white p-4 rounded-2xl border border-stone-200 flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                <Droplets size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-stone-400 text-[10px] font-bold uppercase">
                  Irrigation Source
                </Text>
                <Text className="text-stone-800 font-bold text-xs mt-0.5 capitalize">
                  {profile?.irrigationSource?.join(", ") || "Rainfed"}
                </Text>
              </View>
            </View>
            <View className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Text className="text-blue-700 text-[10px] font-bold">
                Active
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Active Crop Parcels */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-stone-900 font-extrabold text-sm uppercase tracking-wider">
              Active Season Parcels ({profile?.currentCrops?.length || 0})
            </Text>
          </View>

          {profile?.currentCrops?.map((crop: any) => (
            <View
              key={crop._id}
              className="bg-white p-4 rounded-2xl border border-stone-200 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center border border-emerald-100">
                  <Sprout size={18} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-stone-900 font-bold text-sm"
                    numberOfLines={1}
                  >
                    {crop.cropName}{" "}
                    <Text className="text-xs text-stone-400 font-normal">
                      ({crop.variety})
                    </Text>
                  </Text>
                  <Text className="text-emerald-700 text-[11px] font-medium mt-0.5">
                    Season: {crop.season} · {crop.plotArea} {profile?.landUnit}
                  </Text>
                </View>
              </View>
              <View className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Text className="text-emerald-800 text-[10px] font-bold uppercase tracking-wide">
                  {crop.cropStatus}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 4. Credentials & Advisory Preferences */}
        <View className="bg-white rounded-3xl p-5 border border-stone-200 gap-4 shadow-sm">
          <Text className="text-stone-900 font-extrabold text-sm uppercase tracking-wider">
            Account & Security
          </Text>

          <View className="flex-row items-center justify-between py-2 border-b border-stone-100">
            <View className="flex-row items-center gap-3">
              <Phone size={16} color="#78716c" />
              <Text className="text-stone-700 text-xs font-medium">
                Mobile Number
              </Text>
            </View>
            <Text className="text-stone-900 text-xs font-bold">
              +91 {profile?.mobile}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2 border-b border-stone-100">
            <View className="flex-row items-center gap-3">
              <ShieldCheck size={16} color="#78716c" />
              <Text className="text-stone-700 text-xs font-medium">
                Aadhaar Verification
              </Text>
            </View>
            <Text className="text-emerald-700 text-xs font-bold">
              [Aadhaar Verified]
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2 border-b border-stone-100">
            <View className="flex-row items-center gap-3">
              <Globe size={16} color="#78716c" />
              <Text className="text-stone-700 text-xs font-medium">
                Preferred Language
              </Text>
            </View>
            <Text className="text-stone-900 text-xs font-bold">
              {profile?.preferredLanguage}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <MessageSquare size={16} color="#78716c" />
              <Text className="text-stone-700 text-xs font-medium">
                WhatsApp Alerts
              </Text>
            </View>
            <Text className="text-emerald-700 text-xs font-bold">
              {profile?.receiveWhatsAppAlerts ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </View>

        {/* Sign Out Action */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          className="bg-red-50 border border-red-200 py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm mt-2"
        >
          <LogOut size={18} color="#dc2626" />
          <Text className="text-red-600 font-extrabold text-base">
            Sign Out Account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
