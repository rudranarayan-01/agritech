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
import { apiClient } from "../../../services/api";
import { fetchLocalWeatherAndLocation } from "../../../services/weatherService";

export default function HomeScreen() {
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [farmerData, setFarmerData] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

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

  const loadDashboardData = async () => {
    try {
      const response = await apiClient.get("/farmers/dashboard");
      if (response.data?.success) {
        const { farmer, recentInspections } = response.data.data;
        setFarmerData(farmer);

        // Map backend currentCrops parcels to format expected by CropCarousel
        if (farmer.currentCrops && farmer.currentCrops.length > 0) {
          const formattedCrops = farmer.currentCrops.map((parcel: any) => ({
            id: parcel._id,
            name: parcel.cropName,
            stage: parcel.cropStatus ? parcel.cropStatus.toUpperCase() : "SOWN",
            health: "Healthy", // Can be dynamic if health status is stored
          }));
          // Set initial selected crop if not already set
          if (!selectedCrop) {
            setSelectedCrop(formattedCrops[0].id);
          }
        }

        // Map backend recentInspections to format expected by RecentScansList
        const formattedScans = recentInspections.map((scan: any) => ({
          id: scan.id,
          crop: scan.cropName || "Crop",
          diagnosis: scan.diagnosisName || "Diagnosis Complete",
          confidence: `${scan.confidence || 0}%`,
          date: new Date(scan.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          severity: scan.isHealthy ? ("healthy" as const) : ("high" as const),
        }));

        setRecentScans(formattedScans);
      }
    } catch (error: any) {
      console.error(
        "Failed to load dashboard data:",
        error.response?.data || error.message,
      );
    }
  };

  const loadWeatherData = async () => {
    const data = await fetchLocalWeatherAndLocation();
    setWeatherData(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDashboardData(), loadWeatherData()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoadingDashboard(true);
      await Promise.all([loadDashboardData(), loadWeatherData()]);
      setLoadingDashboard(false);
    };
    init();
  }, []);

  // Format backend crops for CropCarousel component
  const carouselCrops =
    farmerData?.currentCrops?.map((parcel: any) => ({
      id: parcel._id,
      name: parcel.cropName,
      stage: `${parcel.season} · ${parcel.plotArea} ${farmerData.landUnit || "acre"}`,
      health: "Healthy",
    })) || [];

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View className="px-5 pt-3 pb-4 border-b border-emerald-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-emerald-600 rounded-xl items-center justify-center">
            <Sprout size={22} color="#ffffff" />
          </View>
          <View>
            <Text className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">
              agritech
            </Text>
            <Text className="text-xs text-emerald-700 font-medium">
              {farmerData?.name
                ? `Welcome, ${farmerData.name}`
                : "Field Advisory & Diagnostics"}
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
            onRefresh={onRefresh}
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

          {/* FIXED ROUTE: Points directly to your crop inspection camera screen */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/crop-inspect" as any)}
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
          crops={carouselCrops}
          selectedCropId={selectedCrop}
          onSelectCrop={(id: string) => setSelectedCrop(id)}
          onAddCropPress={() => {
            // Optional: Handle adding a new crop parcel
          }}
        />

        {/* 4. Quick Advisory Tools Grid Component */}
        <AdvisoryGrid />

        {/* 5. Recent Diagnostic History Component */}
        <RecentScansList
          scans={recentScans}
          onViewAllPress={() => {}}
          onScanPress={(id: string) => {
            router.push({
              pathname: "/inspection-result" as any,
              params: { inspectionId: id },
            });
          }}
        />
      </ScrollView>
    </View>
  );
}
