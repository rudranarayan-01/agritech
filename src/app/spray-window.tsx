import * as Location from "expo-location";
import { router } from "expo-router";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    CloudDrizzle,
    CloudRain,
    Droplets,
    MapPin,
    RefreshCw,
    Sprout,
    Sun,
    Wind,
    XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ImageSourcePropType,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../services/api";

interface HourlySlot {
  time: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  precipProb: number;
  precipMm: number;
  status: "OPTIMAL" | "CAUTION" | "AVOID";
  reasons: string[];
}

interface SprayWindowResponse {
  coordinates: { lat: number; lon: number };
  nextOptimalWindow: HourlySlot | null;
  hourlyForecast: HourlySlot[];
}

type WeatherMood = "rain" | "wind" | "cloudy" | "sunny";

const DEFAULT_COORDS = { lat: 23.2599, lon: 77.4126 };

// Place matching images in assets/weather/ (rainny.webp, windy.webp, cloudy.webp, sunny.webp)
// or swap any entry to your own local asset.
const WEATHER_BACKGROUNDS: Record<WeatherMood, ImageSourcePropType> = {
  rain: require("../../assets/weather/rainny.webp"),
  wind: require("../../assets/weather/windy.webp"),
  cloudy: require("../../assets/weather/cloudy.webp"),
  sunny: require("../../assets/weather/sunny.webp"),
};

// Background photo strength: 0 = hidden, 1 = full. Lower it for a calmer backdrop.
const BACKGROUND_IMAGE_OPACITY = 0.4;

// Shared "glass" surface used by every card on the screen.
const GLASS = "bg-white/15 border border-white/25";

function getWeatherMood(slot: HourlySlot | null): WeatherMood {
  if (!slot) return "sunny";
  if (slot.precipMm > 0 || slot.precipProb >= 45) return "rain";
  if (slot.windSpeed > 18) return "wind";
  if (slot.precipProb >= 20 || slot.humidity >= 82) return "cloudy";
  return "sunny";
}

function getMoodMeta(mood: WeatherMood) {
  switch (mood) {
    case "rain":
      return { tint: "rgba(15, 23, 42, 0.4)", label: "Rainy" };
    case "wind":
      return { tint: "rgba(15, 23, 42, 0.32)", label: "Windy" };
    case "cloudy":
      return { tint: "rgba(15, 23, 42, 0.36)", label: "Overcast" };
    case "sunny":
    default:
      return { tint: "rgba(12, 40, 80, 0.22)", label: "Clear" };
  }
}

function getStatusTheme(status: HourlySlot["status"]) {
  if (status === "OPTIMAL") {
    return {
      label: "Safe to Spray",
      pillBg: "bg-emerald-400/25 border-emerald-300/50",
      pillText: "text-emerald-50",
      dot: "bg-emerald-400",
      bar: "bg-emerald-400",
      iconColor: "#6ee7b7",
    };
  }
  if (status === "CAUTION") {
    return {
      label: "Spray with Caution",
      pillBg: "bg-amber-400/25 border-amber-300/50",
      pillText: "text-amber-50",
      dot: "bg-amber-400",
      bar: "bg-amber-400",
      iconColor: "#fcd34d",
    };
  }
  return {
    label: "Avoid Spraying",
    pillBg: "bg-rose-400/25 border-rose-300/50",
    pillText: "text-rose-50",
    dot: "bg-rose-400",
    bar: "bg-rose-400",
    iconColor: "#fda4af",
  };
}

function formatShortHour(isoString: string, index: number) {
  if (index === 0) return "Now";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString([], { hour: "numeric" });
}

function formatFullTime(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(isoString: string) {
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 30 * 60 * 1000) return "Starting now";
  const hours = Math.round(diffMs / (60 * 60 * 1000));
  return hours <= 1 ? "in about 1 hour" : `in about ${hours} hours`;
}

function SlotIcon({ slot, selected }: { slot: HourlySlot; selected: boolean }) {
  if (slot.precipMm > 0 || slot.precipProb >= 45) {
    return <CloudRain size={22} color={selected ? "#0369a1" : "#7dd3fc"} />;
  }
  if (slot.precipProb >= 20) {
    return <CloudDrizzle size={22} color={selected ? "#0284c7" : "#bae6fd"} />;
  }
  if (slot.windSpeed > 18) {
    return <Wind size={22} color={selected ? "#b45309" : "#fcd34d"} />;
  }
  return <Sun size={22} color={selected ? "#d97706" : "#fde68a"} />;
}

export default function SprayWindowScreen() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationName, setLocationName] = useState("Locating...");
  const [coordsLabel, setCoordsLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forecast, setForecast] = useState<SprayWindowResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const loadSprayWindow = useCallback(async (isRefresh = false) => {
    try {
      setErrorMsg(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let coords = DEFAULT_COORDS;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = {
          lat: Number(position.coords.latitude.toFixed(4)),
          lon: Number(position.coords.longitude.toFixed(4)),
        };

        const [place] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        const area = place?.city || place?.subregion || place?.district;
        setLocationName(area || "Field Location");
        setCoordsLabel(`${coords.lat}°N, ${coords.lon}°E`);
      } else {
        setLocationName("Regional Grid");
        setCoordsLabel(`${coords.lat}°N, ${coords.lon}°E`);
      }

      const res = await apiClient.get("/weather/spray-window", {
        params: { lat: coords.lat, lon: coords.lon },
      });

      if (res.data?.success && res.data?.data) {
        setForecast(res.data.data);
        setSelectedIndex(0);
      } else {
        setErrorMsg(res.data?.message || "Unable to fetch forecast.");
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Failed to load spray window forecast.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSprayWindow(false);
  }, [loadSprayWindow]);

  const currentSlot = forecast?.hourlyForecast?.[0] || null;
  const inspectedSlot =
    forecast?.hourlyForecast?.[selectedIndex] || currentSlot;

  const activeMood = getWeatherMood(inspectedSlot);
  const moodMeta = getMoodMeta(activeMood);

  const stats = useMemo(() => {
    const slots = forecast?.hourlyForecast ?? [];
    if (slots.length === 0) return null;
    const temps = slots.map((s) => s.temp);
    return {
      high: Math.round(Math.max(...temps)),
      low: Math.round(Math.min(...temps)),
      safe: slots.filter((s) => s.status === "OPTIMAL").length,
      caution: slots.filter((s) => s.status === "CAUTION").length,
      avoid: slots.filter((s) => s.status === "AVOID").length,
    };
  }, [forecast]);

  const inspectedTheme = inspectedSlot
    ? getStatusTheme(inspectedSlot.status)
    : null;

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />

      {/* Full-bleed weather photo with a mood-based tint for legibility */}
      <Image
        source={WEATHER_BACKGROUNDS[activeMood]}
        resizeMode="cover"
        style={{ opacity: BACKGROUND_IMAGE_OPACITY }}
        className="absolute inset-0 w-full h-full"
      />
      <View
        style={{ backgroundColor: moodMeta.tint }}
        className="absolute inset-0"
      />

      <View style={{ paddingTop: insets.top }} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className={`w-10 h-10 rounded-full items-center justify-center ${GLASS}`}
          >
            <ArrowLeft size={18} color="#ffffff" />
          </TouchableOpacity>

          <View className="items-center">
            <View className="flex-row items-center gap-1">
              <MapPin size={13} color="#6ee7b7" />
              <Text className="text-base font-bold text-white tracking-tight">
                {locationName}
              </Text>
            </View>
            {coordsLabel ? (
              <Text className="text-[11px] font-medium text-white/70">
                {coordsLabel}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => loadSprayWindow(true)}
            disabled={refreshing || loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Refresh forecast"
            className={`w-10 h-10 rounded-full items-center justify-center ${GLASS}`}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <RefreshCw size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center gap-3 px-6">
            <ActivityIndicator size="large" color="#ffffff" />
            <Text className="text-sm font-semibold text-white">
              Syncing local microclimate...
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadSprayWindow(true)}
                tintColor="#ffffff"
              />
            }
          >
            {errorMsg && (
              <View className="mx-5 mt-2 bg-rose-500/25 border border-rose-300/50 p-3.5 rounded-2xl flex-row items-center gap-2.5">
                <AlertTriangle size={16} color="#fecdd3" />
                <Text className="text-xs font-semibold text-rose-50 flex-1">
                  {errorMsg}
                </Text>
                <TouchableOpacity
                  onPress={() => loadSprayWindow(false)}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-full bg-white/20"
                >
                  <Text className="text-[11px] font-bold text-white">
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!forecast && !errorMsg && (
              <View className="items-center px-8 pt-24">
                <Sprout size={40} color="#ffffff" />
                <Text className="text-base font-bold text-white mt-3">
                  No forecast available
                </Text>
                <Text className="text-xs text-white/70 text-center mt-1">
                  Pull down to refresh and try again.
                </Text>
              </View>
            )}

            {forecast && currentSlot && inspectedSlot && inspectedTheme && (
              <>
                {/* 1. Hero */}
                <View className="items-center pt-6 pb-6 px-5">
                  <Text className="text-xs font-semibold text-white/80 tracking-widest uppercase">
                    {selectedIndex === 0
                      ? `Current · ${moodMeta.label}`
                      : `${formatFullTime(inspectedSlot.time)} · ${moodMeta.label}`}
                  </Text>
                  <Text
                    style={{
                      fontSize: 96,
                      lineHeight: 104,
                      fontWeight: "200",
                      letterSpacing: -4,
                    }}
                    className="text-white mt-1"
                  >
                    {Math.round(inspectedSlot.temp)}°
                  </Text>

                  {stats && (
                    <Text className="text-sm font-medium text-white/80">
                      H:{stats.high}° L:{stats.low}°
                    </Text>
                  )}

                  <View
                    className={`mt-4 px-4 py-1.5 rounded-full border flex-row items-center gap-2 ${inspectedTheme.pillBg}`}
                  >
                    <View
                      className={`w-2 h-2 rounded-full ${inspectedTheme.dot}`}
                    />
                    <Text
                      className={`text-xs font-bold tracking-wide ${inspectedTheme.pillText}`}
                    >
                      {inspectedTheme.label}
                    </Text>
                  </View>
                </View>

                {/* 2. Best window card */}
                <View
                  className={`mx-5 rounded-3xl p-4 flex-row items-center gap-3 ${GLASS}`}
                >
                  <View className="w-11 h-11 rounded-2xl bg-white/20 items-center justify-center">
                    <Clock size={20} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
                      Best spray window
                    </Text>
                    {forecast.nextOptimalWindow ? (
                      <>
                        <Text className="text-base font-bold text-white mt-0.5">
                          {formatFullTime(forecast.nextOptimalWindow.time)}
                        </Text>
                        <Text className="text-xs text-white/70">
                          {formatCountdown(forecast.nextOptimalWindow.time)}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-sm font-semibold text-white mt-0.5">
                        No ideal window in the next 24 hours
                      </Text>
                    )}
                  </View>
                </View>

                {/* 3. Hourly strip */}
                <View className={`mx-5 mt-4 rounded-3xl py-4 ${GLASS}`}>
                  <View className="px-4 pb-3 flex-row items-center justify-between border-b border-white/15">
                    <Text className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
                      24-hour forecast
                    </Text>
                    <Text className="text-[10px] font-medium text-white/60">
                      Tap an hour
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: 14,
                      paddingTop: 14,
                      gap: 8,
                    }}
                  >
                    {forecast.hourlyForecast.map((slot, idx) => {
                      const isSelected = idx === selectedIndex;
                      const theme = getStatusTheme(slot.status);

                      return (
                        <TouchableOpacity
                          key={`${slot.time}-${idx}`}
                          onPress={() => setSelectedIndex(idx)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          accessibilityLabel={`${formatShortHour(slot.time, idx)}, ${Math.round(slot.temp)} degrees, ${theme.label}`}
                          className={`w-16 py-3 rounded-2xl items-center justify-between gap-2.5 ${
                            isSelected
                              ? "bg-white"
                              : "bg-white/10 border border-white/15"
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? "text-slate-600" : "text-white/80"
                            }`}
                          >
                            {formatShortHour(slot.time, idx)}
                          </Text>

                          <SlotIcon slot={slot} selected={isSelected} />

                          <Text
                            className={`text-sm font-extrabold ${
                              isSelected ? "text-slate-900" : "text-white"
                            }`}
                          >
                            {Math.round(slot.temp)}°
                          </Text>

                          <View className="items-center gap-1">
                            <Text
                              className={`text-[10px] font-bold ${
                                isSelected ? "text-sky-700" : "text-sky-200"
                              }`}
                            >
                              {slot.precipProb}%
                            </Text>
                            <View
                              className={`w-2 h-2 rounded-full ${theme.dot}`}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 4. Suitability timeline */}
                {stats && (
                  <View className={`mx-5 mt-4 rounded-3xl p-4 ${GLASS}`}>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
                        Spray suitability
                      </Text>
                      <Text className="text-[11px] font-semibold text-white/80">
                        {stats.safe}h safe · {stats.caution}h caution ·{" "}
                        {stats.avoid}h avoid
                      </Text>
                    </View>

                    <View className="flex-row items-end gap-[3px] mt-4 h-8">
                      {forecast.hourlyForecast.map((slot, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <TouchableOpacity
                            key={`bar-${slot.time}-${idx}`}
                            onPress={() => setSelectedIndex(idx)}
                            activeOpacity={0.8}
                            hitSlop={{ top: 8, bottom: 8 }}
                            accessibilityRole="button"
                            accessibilityLabel={`${formatShortHour(slot.time, idx)}, ${getStatusTheme(slot.status).label}`}
                            className={`flex-1 rounded-full ${getStatusTheme(slot.status).bar} ${
                              isSelected ? "h-8" : "h-4 opacity-80"
                            }`}
                          />
                        );
                      })}
                    </View>

                    <View className="flex-row justify-between mt-2">
                      <Text className="text-[10px] font-medium text-white/60">
                        Now
                      </Text>
                      <Text className="text-[10px] font-medium text-white/60">
                        {formatShortHour(
                          forecast.hourlyForecast[
                            forecast.hourlyForecast.length - 1
                          ].time,
                          1,
                        )}
                      </Text>
                    </View>
                  </View>
                )}

                {/* 5. Detail tiles */}
                <View className="mx-5 mt-4 gap-3">
                  <Text className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-1">
                    {selectedIndex === 0
                      ? "Right now"
                      : formatFullTime(inspectedSlot.time)}
                  </Text>

                  <View className="flex-row gap-3">
                    <View
                      className={`flex-1 p-4 rounded-3xl justify-between ${GLASS}`}
                    >
                      <View className="flex-row items-center gap-1.5">
                        <Wind size={14} color="#ffffffb3" />
                        <Text className="text-[11px] font-bold text-white/70 uppercase">
                          Wind
                        </Text>
                      </View>
                      <View className="mt-3">
                        <Text className="text-2xl font-extrabold text-white">
                          {inspectedSlot.windSpeed}
                          <Text className="text-xs font-semibold text-white/70">
                            {" "}
                            km/h
                          </Text>
                        </Text>
                        <Text className="text-[11px] text-white/70 mt-0.5">
                          {inspectedSlot.windSpeed > 18
                            ? "High drift risk"
                            : inspectedSlot.windSpeed < 3
                              ? "Calm / inversion"
                              : "Ideal spray drift"}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`flex-1 p-4 rounded-3xl justify-between ${GLASS}`}
                    >
                      <View className="flex-row items-center gap-1.5">
                        <CloudRain size={14} color="#7dd3fc" />
                        <Text className="text-[11px] font-bold text-white/70 uppercase">
                          Rain
                        </Text>
                      </View>
                      <View className="mt-3">
                        <Text className="text-2xl font-extrabold text-white">
                          {inspectedSlot.precipProb}%
                        </Text>
                        <Text className="text-[11px] text-white/70 mt-0.5">
                          {inspectedSlot.precipMm > 0
                            ? `${inspectedSlot.precipMm} mm expected`
                            : "Dry window"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View
                      className={`flex-1 p-4 rounded-3xl justify-between ${GLASS}`}
                    >
                      <View className="flex-row items-center gap-1.5">
                        <Droplets size={14} color="#6ee7b7" />
                        <Text className="text-[11px] font-bold text-white/70 uppercase">
                          Humidity
                        </Text>
                      </View>
                      <View className="mt-3">
                        <Text className="text-2xl font-extrabold text-white">
                          {inspectedSlot.humidity}%
                        </Text>
                        <Text className="text-[11px] text-white/70 mt-0.5">
                          {inspectedSlot.humidity < 40
                            ? "Fast evaporation"
                            : "Good leaf retention"}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`flex-1 p-4 rounded-3xl justify-between ${GLASS}`}
                    >
                      <View className="flex-row items-center gap-1.5">
                        <Sun size={14} color="#fde68a" />
                        <Text className="text-[11px] font-bold text-white/70 uppercase">
                          Temperature
                        </Text>
                      </View>
                      <View className="mt-3">
                        <Text className="text-2xl font-extrabold text-white">
                          {Math.round(inspectedSlot.temp)}°
                        </Text>
                        <Text className="text-[11px] text-white/70 mt-0.5">
                          {inspectedSlot.temp > 32
                            ? "Spray early or late"
                            : inspectedSlot.temp < 10
                              ? "Slow absorption"
                              : "Good working range"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Advisory */}
                  <View className={`p-4 rounded-3xl ${GLASS}`}>
                    <View className="flex-row items-center gap-2">
                      {inspectedSlot.status === "AVOID" ? (
                        <XCircle size={16} color={inspectedTheme.iconColor} />
                      ) : (
                        <CheckCircle2
                          size={16}
                          color={inspectedTheme.iconColor}
                        />
                      )}
                      <Text className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
                        Advisory
                      </Text>
                    </View>

                    {inspectedSlot.reasons.length > 0 ? (
                      <View className="mt-3 gap-2">
                        {inspectedSlot.reasons.map((reason, idx) => (
                          <View
                            key={`${reason}-${idx}`}
                            className="flex-row items-start gap-2"
                          >
                            <View
                              className={`w-1.5 h-1.5 rounded-full mt-1.5 ${inspectedTheme.dot}`}
                            />
                            <Text className="flex-1 text-sm font-medium text-white leading-5">
                              {reason}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text className="text-sm font-medium text-white mt-3 leading-5">
                        Conditions are within safe limits for spraying.
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
