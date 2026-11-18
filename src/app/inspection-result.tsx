import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sprout,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../services/api";

export default function InspectionResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const inspectionId = params.inspectionId as string;
  const resultDataParam = params.resultData as string;
  const imageUri = params.imageUri as string;
  const locationParam = params.location as string;
  const tempParam = params.temp as string;

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);

        // Path A: Navigated directly from live camera scan
        if (resultDataParam) {
          const parsed = JSON.parse(resultDataParam);
          setResult(parsed);
          setLoading(false);
          return;
        }

        // Path B: Navigated from history list using inspection ID
        if (inspectionId) {
          const response = await apiClient.get(
            `/analysis/quick/${inspectionId}`,
          );
          if (response.data?.success) {
            setResult(response.data.data);
          }
        }
      } catch (error: any) {
        console.error(
          "Failed to load inspection details:",
          error.response?.data || error.message,
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [inspectionId, resultDataParam]); // Depend only on primitive strings, NOT the params object

  if (loading) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 items-center justify-center bg-white"
      >
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-stone-500 text-xs mt-3 font-medium">
          Loading diagnosis report...
        </Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 items-center justify-center bg-white p-6"
      >
        <Text className="text-stone-800 font-bold text-base mb-4">
          No Inspection Data Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-emerald-700 px-5 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle both snake_case (live API) and camelCase (MongoDB document) field mappings safely
  const isHealthy =
    result.diagnosis?.isHealthy ?? result.diagnosis?.is_healthy ?? false;
  const diagnosisName = result.diagnosis?.name || "Unknown Condition";
  const scientificName =
    result.diagnosis?.scientificName || result.diagnosis?.scientific_name;
  const confidenceScore = result.diagnosis?.confidence || 0;
  const descriptionText =
    result.diagnosis?.description || "No description available.";
  const cropName = result.crop?.name || "Crop";

  const treatments = result.treatments || {};
  const organicSteps: string[] = treatments.biological || [];
  const chemicalSteps: string[] = treatments.chemical || [];
  const preventionSteps: string[] = treatments.prevention || [];

  const displayLocation =
    locationParam ||
    (result.location
      ? `${result.location.village || "Farm"}, ${result.location.district || "District"}`
      : null);

  const displayTemp =
    tempParam || result.weatherAtInspection?.temperature || null;
  const displayImage = imageUri || result.imageUrl || null;

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-stone-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-5 py-3.5 bg-white border-b border-stone-200 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-stone-100 items-center justify-center"
        >
          <ArrowLeft size={20} color="#1c1917" />
        </TouchableOpacity>
        <Text className="text-base font-extrabold text-stone-900">
          Diagnosis Report
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Captured Image & Diagnosis Card */}
        <View className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm">
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              className="w-full h-56"
              resizeMode="cover"
            />
          ) : null}

          <View className="p-5 gap-3">
            <View className="flex-row items-center justify-between">
              <View
                className={`px-3 py-1 rounded-full flex-row items-center gap-1.5 ${
                  isHealthy ? "bg-emerald-100" : "bg-amber-100"
                }`}
              >
                {isHealthy ? (
                  <ShieldCheck size={14} color="#047857" />
                ) : (
                  <AlertTriangle size={14} color="#b45309" />
                )}
                <Text
                  className={`text-xs font-extrabold uppercase ${
                    isHealthy ? "text-emerald-800" : "text-amber-900"
                  }`}
                >
                  {isHealthy ? "Healthy Specimen" : "Disease Detected"}
                </Text>
              </View>

              <Text className="text-xs font-bold text-stone-500">
                {confidenceScore}% Match
              </Text>
            </View>

            <View>
              <Text className="text-xl font-extrabold text-stone-900">
                {diagnosisName.toUpperCase()}
              </Text>
              {scientificName ? (
                <Text className="text-xs italic text-stone-500 mt-0.5">
                  {scientificName}
                </Text>
              ) : null}
            </View>

            {displayLocation ? (
              <View className="flex-row items-center gap-2 pb-1 rounded-xl">
                <MapPin size={13} color="#059669" />
                <Text className="text-xs text-blue-600 font-medium">
                  {displayLocation} {displayTemp ? `· ${displayTemp}°C` : ""} ·{" "}
                  {cropName}
                </Text>
              </View>
            ) : null}

            <Text className="text-stone-600 text-xs leading-relaxed">
              {descriptionText}
            </Text>
          </View>
        </View>

        {/* Stacked Treatment Sections (One below another, NO tabs) */}
        {!isHealthy && (
          <View className="gap-4">
            <Text className="text-base font-extrabold text-stone-900 px-1">
              Recommended Treatments & Management
            </Text>

            {/* 1. Organic / Biological Treatments */}
            <View className="bg-white rounded-3xl p-5 border border-stone-200 gap-3 shadow-sm">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-lg bg-emerald-50 items-center justify-center">
                  <Sprout size={16} color="#059669" />
                </View>
                <Text className="text-stone-900 font-extrabold text-sm">
                  Organic & Biological Control
                </Text>
              </View>

              <View className="gap-2.5">
                {organicSteps.length > 0 ? (
                  organicSteps.map((step: string, idx: number) => (
                    <View
                      key={`bio-${idx}`}
                      className="flex-row items-start gap-2.5 p-3 rounded-2xl"
                    >
                      <CheckCircle2
                        size={16}
                        color="#059669"
                        className="mt-0.5"
                      />
                      <Text className="flex-1 text-xs text-stone-700 leading-relaxed">
                        {step}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-xs text-stone-400 italic pl-1">
                    No specific organic measures listed. Follow general crop
                    hygiene.
                  </Text>
                )}
              </View>
            </View>

            {/* 2. Chemical Treatments */}
            <View className="bg-white rounded-3xl p-5 border border-stone-200 gap-3 shadow-sm">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-lg bg-blue-50 items-center justify-center">
                  <FlaskConical size={16} color="#2563eb" />
                </View>
                <Text className="text-stone-900 font-extrabold text-sm">
                  Chemical Recommendations
                </Text>
              </View>

              <View className="gap-2.5">
                {chemicalSteps.length > 0 ? (
                  chemicalSteps.map((step: string, idx: number) => (
                    <View
                      key={`chem-${idx}`}
                      className="flex-row items-start gap-2.5 p-3 rounded-2xl"
                    >
                      <CheckCircle2
                        size={16}
                        color="#2563eb"
                        className="mt-0.5"
                      />
                      <Text className="flex-1 text-xs text-stone-700 leading-relaxed">
                        {step}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-xs text-stone-400 italic pl-1">
                    Consult your local Krishi Kendra officer for chemical
                    dosages.
                  </Text>
                )}
              </View>
            </View>

            {/* 3. Prevention Guidelines */}
            <View className="bg-white rounded-3xl p-5 border border-stone-200 gap-3 shadow-sm">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-lg bg-amber-50 items-center justify-center">
                  <ShieldAlert size={16} color="#d97706" />
                </View>
                <Text className="text-stone-900 font-extrabold text-sm">
                  Preventive Measures
                </Text>
              </View>

              <View className="gap-2.5">
                {preventionSteps.length > 0 ? (
                  preventionSteps.map((step: string, idx: number) => (
                    <View
                      key={`prev-${idx}`}
                      className="flex-row items-start gap-2.5 p-3 rounded-2xl "
                    >
                      <CheckCircle2
                        size={16}
                        color="#d97706"
                        className="mt-0.5"
                      />
                      <Text className="flex-1 text-xs text-stone-700 leading-relaxed">
                        {step}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-xs text-stone-400 italic pl-1">
                    Maintain proper spacing and crop rotation to prevent
                    recurrence.
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="bg-emerald-700 py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm mt-2"
        >
          <RefreshCw size={18} color="#ffffff" />
          <Text className="text-white font-extrabold text-base">
            Scan Another Leaf
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
