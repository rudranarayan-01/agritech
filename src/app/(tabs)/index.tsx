import { router } from "expo-router";
import { Bell, Camera, ShieldCheck, Sprout } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AdvisoryGrid from "../../../components/home/AdvisoryGrid";
import CropCarousel from "../../../components/home/CropCarousel";
import RecentScansList from "../../../components/home/RecentScansList";
import WeatherStrip from "../../../components/home/WeatherStrip";
import { fetchLocalWeatherAndLocation } from "../../../services/weatherService";

const MOCK_CROPS = [
  { id: "1", name: "Tomato", stage: "Flowering", health: "Healthy" },
  { id: "2", name: "Wheat", stage: "Tillering", health: "Alert" },
  { id: "3", name: "Potato", stage: "Vegetative", health: "Healthy" },
  { id: "4", name: "Rice", stage: "Seedling", health: "Healthy" },
];

const MOCK_SCANS: Array<{
  id: string;
  crop: string;
  diagnosis: string;
  confidence: string;
  date: string;
  severity: "high" | "healthy";
}> = [
  {
    id: "101",
    crop: "Tomato Leaf",
    diagnosis: "Early Blight Detected",
    confidence: "96%",
    date: "Today, 10:24 AM",
    severity: "high",
  },
  {
    id: "102",
    crop: "Potato Foliage",
    diagnosis: "Healthy Specimen",
    confidence: "99%",
    date: "Yesterday",
    severity: "healthy",
  },
];

export default function HomeScreen() {
  const [selectedCrop, setSelectedCrop] = useState("1");
  const [weatherData, setWeatherData] = useState<{
    locationName: string;
    temperature: number | string;
    humidity: number | string;
    windSpeed: number | string;
    condition: string;
    latitude?: number;
    longitude?: number;
  }>({
    locationName: "Loading location...",
    temperature: "--",
    humidity: "--",
    windSpeed: "--",
    condition: "Fetching weather...",
  });
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadWeatherData = async () => {
    setRefreshing(true);
    const data = await fetchLocalWeatherAndLocation();
    setWeatherData(data);
    setRefreshing(false);
  };

  useEffect(() => {
    loadWeatherData();
  }, []);

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View className="bg-white px-5 pt-3 pb-4 border-b border-emerald-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-emerald-600 rounded-xl items-center justify-center">
            <Sprout size={22} color="#ffffff" />
          </View>
          <View>
            <Text className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">
              agritech
            </Text>
            <Text className="text-xs text-emerald-700 font-medium">
              Field Advisory & Diagnostics
            </Text>
          </View>
        </View>

        <TouchableOpacity className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center border border-emerald-200">
          <Bell size={18} color="#047857" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 48,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadWeatherData}
            tintColor="#059669"
          />
        }
      >
        {/* 1. Primary Hero Card (AI Scanner Action) */}
        <View className="bg-emerald-700 rounded-3xl p-6 shadow-sm">
          <View className="flex-row items-center gap-2 bg-emerald-800/80 self-start px-3 py-1 rounded-full mb-3 border border-emerald-500/30">
            <ShieldCheck size={13} color="#a7f3d0" />
            <Text className="text-emerald-100 text-[11px] font-semibold uppercase tracking-wider">
              AI Vision Engine Ready
            </Text>
          </View>

          <Text className="text-2xl font-extrabold text-white leading-tight">
            Heal Your Crop in Seconds
          </Text>
          <Text className="text-emerald-100 text-sm mt-1.5 leading-relaxed">
            Snap a photo of an affected leaf to identify pests, nutrient
            deficiencies, and fungal diseases instantly.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/explore" as any)}
            className="mt-5 bg-white py-3.5 px-5 rounded-2xl flex-row items-center justify-center gap-2.5 shadow-sm"
          >
            <Camera size={20} color="#047857" />
            <Text className="text-emerald-800 font-extrabold text-base">
              Take a Picture
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Live Field Telemetry & Weather Strip Component */}
        <WeatherStrip
          locationName={weatherData.locationName}
          temperature={weatherData.temperature}
          humidity={weatherData.humidity}
          windSpeed={weatherData.windSpeed}
          condition={weatherData.condition}
        />

        {/* 3. Active Crops Carousel Component */}
        <CropCarousel
          crops={MOCK_CROPS}
          selectedCropId={selectedCrop}
          onSelectCrop={(id: string) => setSelectedCrop(id)}
        />

        {/* 4. Quick Advisory Tools Grid Component */}
        <AdvisoryGrid />

        {/* 5. Recent Diagnostic History Component */}
        <RecentScansList scans={MOCK_SCANS} />
      </ScrollView>
    </View>
  );
}
