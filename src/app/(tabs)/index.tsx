import { router, useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  Bell,
  Camera,
  RefreshCw,
  ShieldCheck,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
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

/* ───────────────────────────── Types ───────────────────────────── */

interface CropParcel {
  _id: string;
  cropName: string;
  cropStatus?: string;
  season?: string;
  plotArea?: number | string;
}

interface Farmer {
  name?: string;
  landUnit?: string;
  currentCrops?: CropParcel[];
}

interface Inspection {
  id: string;
  cropName?: string;
  diagnosisName?: string;
  confidence?: number;
  date: string;
  isHealthy?: boolean;
}

interface CarouselCrop {
  id: string;
  name: string;
  stage: string;
  health: string;
}

interface RecentScan {
  id: string;
  crop: string;
  diagnosis: string;
  confidence: string;
  date: string;
  severity: "healthy" | "high";
}

interface WeatherData {
  locationName: string;
  temperature: number | string;
  humidity: number | string;
  windSpeed: number | string;
  condition: string;
  latitude?: number;
  longitude?: number;
}

const INITIAL_WEATHER: WeatherData = {
  locationName: "Loading location...",
  temperature: "--",
  humidity: "--",
  windSpeed: "--",
  condition: "Fetching weather...",
};

const UNAVAILABLE_WEATHER: WeatherData = {
  locationName: "Location unavailable",
  temperature: "--",
  humidity: "--",
  windSpeed: "--",
  condition: "Weather unavailable",
};

/* ───────────────────────────── Helpers ───────────────────────────── */

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatScanDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toRecentScan(scan: Inspection): RecentScan {
  return {
    id: scan.id,
    crop: scan.cropName || "Crop",
    diagnosis: scan.diagnosisName || "Diagnosis Complete",
    confidence: `${Math.round(scan.confidence || 0)}%`,
    date: formatScanDate(scan.date),
    severity: scan.isHealthy ? "healthy" : "high",
  };
}

function toCarouselCrop(parcel: CropParcel, landUnit?: string): CarouselCrop {
  const details = [
    parcel.season,
    parcel.plotArea ? `${parcel.plotArea} ${landUnit || "acre"}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: parcel._id,
    name: parcel.cropName,
    stage:
      details || (parcel.cropStatus ? parcel.cropStatus.toUpperCase() : "SOWN"),
    health: "Healthy", // Replace once the backend stores a per-crop health status
  };
}

/* ───────────────────────────── Small components ───────────────────────────── */

function SkeletonBlock({
  height,
  width = "100%",
  radius = 16,
}: {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        height,
        width,
        borderRadius: radius,
        backgroundColor: "#e2e8f0",
        opacity,
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View style={{ gap: 24 }} accessibilityLabel="Loading your dashboard">
      <View style={{ gap: 12 }}>
        <SkeletonBlock height={18} width={140} radius={8} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <SkeletonBlock height={110} width={150} />
          <SkeletonBlock height={110} width={150} />
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <SkeletonBlock height={18} width={120} radius={8} />
        <SkeletonBlock height={68} />
        <SkeletonBlock height={68} />
        <SkeletonBlock height={68} />
      </View>
    </View>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="bg-white border border-rose-100 rounded-3xl p-6 items-center">
      <View className="w-12 h-12 rounded-full bg-rose-50 items-center justify-center">
        <AlertTriangle size={22} color="#e11d48" />
      </View>
      <Text className="text-base font-bold text-slate-900 mt-3">
        Couldn't load your farm data
      </Text>
      <Text className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
        {message}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Retry loading dashboard"
        className="mt-4 flex-row items-center gap-2 bg-emerald-700 px-5 py-2.5 rounded-full"
      >
        <RefreshCw size={14} color="#ffffff" />
        <Text className="text-sm font-bold text-white">Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ───────────────────────────── Screen ───────────────────────────── */

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [farmerData, setFarmerData] = useState<Farmer | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData>(INITIAL_WEATHER);
  const [refreshing, setRefreshing] = useState(false);

  const hasLoadedOnce = useRef(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await apiClient.get("/farmers/dashboard");
      if (!response.data?.success || !response.data?.data) {
        throw new Error(
          response.data?.message || "Unable to load your dashboard.",
        );
      }

      const { farmer, recentInspections } = response.data.data as {
        farmer?: Farmer;
        recentInspections?: Inspection[];
      };

      setFarmerData(farmer ?? null);
      setRecentScans((recentInspections ?? []).map(toRecentScan));
      setDashboardError(null);
    } catch (error: any) {
      console.error(
        "Failed to load dashboard data:",
        error.response?.data || error.message,
      );
      setDashboardError(
        error.response?.data?.message ||
          error.message ||
          "Please check your connection and try again.",
      );
    }
  }, []);

  const loadWeatherData = useCallback(async () => {
    try {
      const data = await fetchLocalWeatherAndLocation();
      setWeatherData(data);
    } catch (error: any) {
      console.error("Failed to load weather data:", error?.message || error);
      // Keep the last known reading if we have one; otherwise show an explicit fallback.
      setWeatherData((prev) =>
        prev.temperature === "--" ? UNAVAILABLE_WEATHER : prev,
      );
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadDashboardData(), loadWeatherData()]);
  }, [loadDashboardData, loadWeatherData]);

  // First focus shows skeletons; later focuses (e.g. coming back from a scan) refresh silently.
  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        if (!hasLoadedOnce.current) setLoadingDashboard(true);
        await loadAll();
        hasLoadedOnce.current = true;
        setLoadingDashboard(false);
      };
      run();
    }, [loadAll]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const onRetry = useCallback(async () => {
    setLoadingDashboard(true);
    await loadAll();
    setLoadingDashboard(false);
  }, [loadAll]);

  const carouselCrops = useMemo<CarouselCrop[]>(
    () =>
      (farmerData?.currentCrops ?? []).map((parcel) =>
        toCarouselCrop(parcel, farmerData?.landUnit),
      ),
    [farmerData],
  );

  // Keep the selected crop valid whenever the crop list changes.
  useEffect(() => {
    if (carouselCrops.length === 0) {
      setSelectedCrop("");
      return;
    }
    setSelectedCrop((prev) =>
      carouselCrops.some((c) => c.id === prev) ? prev : carouselCrops[0].id,
    );
  }, [carouselCrops]);

  const firstName = farmerData?.name?.trim().split(/\s+/)[0];
  const greeting = getGreeting();

  const summary = loadingDashboard
    ? ""
    : `${carouselCrops.length} active ${carouselCrops.length === 1 ? "crop" : "crops"} · ${recentScans.length} recent ${recentScans.length === 1 ? "scan" : "scans"}`;

  const showFullError = !loadingDashboard && !!dashboardError && !farmerData;
  const showStaleBanner = !loadingDashboard && !!dashboardError && !!farmerData;

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View className="px-5 pt-3 pb-3 border-b border-emerald-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-xl bg-white overflow-hidden items-center justify-center p-1 border border-slate-100">
            <Image
              source={require("../../../assets/icon.png")}
              className="w-full h-full rounded-lg"
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <Text className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">
            agritech
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center border border-emerald-200"
        >
          <Bell size={18} color="#047857" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 48,
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
        {/* Greeting */}
        <View>
          <Text className="text-sm font-medium text-emerald-700">
            {greeting}
          </Text>
          <Text
            className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5"
            numberOfLines={1}
          >
            {firstName ? firstName : "Welcome back"}
          </Text>
          {summary ? (
            <Text className="text-xs font-medium text-slate-500 mt-1">
              {summary}
            </Text>
          ) : null}
        </View>

        {/* 1. Primary Hero Card (AI Scanner Action) */}
        <View className="bg-emerald-700 rounded-3xl p-6 overflow-hidden">
          <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-600/40" />
          <View className="absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-emerald-800/50" />

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
            onPress={() => router.push("/crop-inspect" as any)}
            accessibilityRole="button"
            accessibilityLabel="Take a picture of an affected leaf"
            className="mt-5 bg-white py-3.5 px-5 rounded-2xl flex-row items-center justify-center gap-2.5"
          >
            <Camera size={20} color="#047857" />
            <Text className="text-emerald-800 font-extrabold text-base">
              Take a Picture
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Live Field Telemetry & Weather Strip */}
        <WeatherStrip
          locationName={weatherData.locationName}
          temperature={weatherData.temperature}
          humidity={weatherData.humidity}
          windSpeed={weatherData.windSpeed}
          condition={weatherData.condition}
        />

        {/* Stale-data notice (we have data, but the latest refresh failed) */}
        {showStaleBanner && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex-row items-center gap-2.5">
            <AlertTriangle size={16} color="#b45309" />
            <Text className="flex-1 text-xs font-semibold text-amber-800">
              Showing saved data. We couldn't refresh just now.
            </Text>
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Retry"
              className="px-3 py-1.5 rounded-full bg-amber-100"
            >
              <Text className="text-[11px] font-bold text-amber-900">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3 & 5. Dashboard-driven sections */}
        {loadingDashboard ? (
          <DashboardSkeleton />
        ) : showFullError ? (
          <ErrorCard message={dashboardError ?? ""} onRetry={onRetry} />
        ) : (
          <>
            <CropCarousel
              crops={carouselCrops}
              selectedCropId={selectedCrop}
              onSelectCrop={(id: string) => setSelectedCrop(id)}
              onAddCropPress={() => {}}
            />

            {/* 4. Quick Advisory Tools Grid */}
            <AdvisoryGrid />

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
          </>
        )}

        {/* Advisory tools don't depend on dashboard data, so keep them available if it failed. */}
        {(loadingDashboard || showFullError) && <AdvisoryGrid />}
      </ScrollView>
    </View>
  );
}
