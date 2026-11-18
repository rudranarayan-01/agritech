import { router } from "expo-router";
import {
  AlertTriangle,
  MapPin,
  Search,
  ShieldCheck,
  Sprout,
  Thermometer,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../../services/api";

interface InspectionSummary {
  _id: string;
  crop: {
    name: string;
    confidence: number;
    isUserSpecified: boolean;
  };
  diagnosis: {
    name: string;
    scientificName?: string;
    isHealthy: boolean;
    description: string;
  };
  location: {
    village?: string;
    district?: string;
  };
  weatherAtInspection?: {
    temperature: number;
    condition: string;
  };
  createdAt: string;
}

export default function InspectionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInspectionHistory = async () => {
    try {
      const response = await apiClient.get("/analysis/quick");
      if (response.data?.success) {
        setInspections(response.data.data);
      }
    } catch (error: any) {
      console.error(
        "Fetch Inspections Error:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInspectionHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInspectionHistory();
  };

  // Filter inspections based on search query (Crop name or Diagnosis name)
  const filteredInspections = inspections.filter((item) => {
    const query = searchQuery.toLowerCase();
    const cropName = item.crop?.name?.toLowerCase() || "";
    const diseaseName = item.diagnosis?.name?.toLowerCase() || "";
    const village = item.location?.village?.toLowerCase() || "";
    return (
      cropName.includes(query) ||
      diseaseName.includes(query) ||
      village.includes(query)
    );
  });

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-stone-50">
      <StatusBar barStyle="dark-content" />

      {/* Header & Search Bar */}
      <View className="px-5 pt-3 pb-4 bg-white border-b border-stone-200">
        <Text className="text-xl font-extrabold text-stone-900 tracking-tight">
          Inspection History
        </Text>
        <Text className="text-xs text-stone-500 font-medium mt-0.5">
          Past field diagnostics & AI telemetry logs
        </Text>

        <View className="mt-4 flex-row items-center bg-stone-100 px-4 py-3 rounded-2xl border border-stone-200 gap-2.5">
          <Search size={18} color="#78716c" />
          <TextInput
            placeholder="Search by crop, disease, or village..."
            placeholderTextColor="#a8a29e"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-stone-900 text-sm font-medium"
          />
        </View>
      </View>

      {/* Content Feed */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#059669"
            />
          }
        >
          {filteredInspections.length === 0 ? (
            <View className="items-center justify-center py-20 gap-2">
              <Sprout size={40} color="#a8a29e" />
              <Text className="text-stone-700 font-bold text-sm">
                No inspection logs found
              </Text>
              <Text className="text-stone-400 text-xs text-center px-10">
                Scan your crop leaves using Leaf Doctor to record field
                diagnostics here.
              </Text>
            </View>
          ) : (
            filteredInspections.map((item) => {
              const isHealthy = item.diagnosis?.isHealthy;
              const formattedDate = new Date(item.createdAt).toLocaleDateString(
                "en-IN",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              );

              return (
                <TouchableOpacity
                  key={item._id}
                  activeOpacity={0.88}
                  onPress={() => {
                    router.push({
                      pathname: "/inspection-result" as any,
                      params: { inspectionId: item._id },
                    });
                  }}
                  className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs gap-3.5"
                >
                  {/* Top Row: Crop Name & Status Pill */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 bg-emerald-50 rounded-2xl items-center justify-center border border-emerald-100">
                        <Sprout size={20} color="#059669" />
                      </View>
                      <View>
                        <Text className="text-stone-900 font-extrabold text-base tracking-tight">
                          {item.crop?.name || "Crop"}
                        </Text>
                        <Text className="text-stone-400 text-[11px] font-medium">
                          {formattedDate}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`px-3 py-1 rounded-full flex-row items-center gap-1 ${
                        isHealthy ? "bg-emerald-100" : "bg-amber-100"
                      }`}
                    >
                      {isHealthy ? (
                        <ShieldCheck size={12} color="#047857" />
                      ) : (
                        <AlertTriangle size={12} color="#b45309" />
                      )}
                      <Text
                        className={`text-[10px] font-extrabold uppercase ${
                          isHealthy ? "text-emerald-800" : "text-amber-900"
                        }`}
                      >
                        {isHealthy ? "Healthy" : "Alert"}
                      </Text>
                    </View>
                  </View>

                  {/* Middle: Diagnosis Name & Description Snippet */}
                  <View className="bg-stone-50 p-3 rounded-2xl border border-stone-100 gap-1">
                    <Text className="text-stone-900 font-bold text-xs uppercase tracking-wider">
                      Diagnosis: {item.diagnosis?.name || "Unknown"}
                    </Text>
                    <Text
                      className="text-stone-600 text-xs leading-relaxed"
                      numberOfLines={2}
                    >
                      {item.diagnosis?.description}
                    </Text>
                  </View>

                  {/* Bottom Row: Location & Weather Telemetry */}
                  <View className="flex-row items-center justify-between pt-1">
                    <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                      <MapPin size={13} color="#78716c" />
                      <Text
                        className="text-stone-500 text-xs font-medium"
                        numberOfLines={1}
                      >
                        {item.location?.village || "Farm"},{" "}
                        {item.location?.district || "District"}
                      </Text>
                    </View>

                    {item.weatherAtInspection?.temperature && (
                      <View className="flex-row items-center gap-1">
                        <Thermometer size={13} color="#78716c" />
                        <Text className="text-stone-500 text-xs font-medium">
                          {item.weatherAtInspection.temperature}°C
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
