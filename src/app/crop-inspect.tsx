import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
    AlertTriangle,
    ArrowLeft,
    Camera,
    CheckCircle2,
    FlaskConical,
    Image as ImageIcon,
    Leaf,
    MapPin,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Sprout,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../services/api";
import { fetchLocalWeatherAndLocation } from "../../services/weatherService";

const CROPS = [
  {
    name: "Tomato",
    image:
      "https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Wheat",
    image:
      "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Potato",
    image:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Rice",
    image:
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Cotton",
    image:
      "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Sugarcane",
    image:
      "https://images.unsplash.com/photo-1627920769842-6887c6df05ca?q=80&w=300&auto=format&fit=crop",
  },
];

interface AnalysisResponse {
  crop: {
    name: string;
    confidence: number;
    is_user_specified: boolean;
  };
  diagnosis: {
    name: string;
    scientific_name: string | null;
    confidence: number;
    is_healthy: boolean;
    description: string;
  };
  treatments: {
    biological: string[];
    chemical: string[];
    prevention: string[];
  };
  reference_images?: Array<{ url: string; citation: string }>;
}

export default function CropInspectScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [statusStep, setStatusStep] = useState<string>("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [telemetryMeta, setTelemetryMeta] = useState<{
    location: string;
    temp: number | string;
  } | null>(null);
  const [activeTreatmentTab, setActiveTreatmentTab] = useState<
    "biological" | "chemical" | "prevention"
  >("biological");

  // Core background pipeline: GPS + Weather + Multipart Upload to /analysis/inspect
  const processAndAnalyzeImage = async (uri: string, cropName: string) => {
    setImageUri(uri);
    setResult(null);
    setAnalyzing(true);

    try {
      // 1. Gather location & Open-Meteo weather silently in background
      setStatusStep("Tagging farm GPS & live weather...");
      const weatherData = await fetchLocalWeatherAndLocation();
      setTelemetryMeta({
        location: weatherData.locationName,
        temp: weatherData.temperature,
      });

      // 2. Construct Multipart FormData matching backend inspectCrop controller
      setStatusStep(`Analyzing ${cropName} leaf tissue...`);
      const formData = new FormData();

      const filename = uri.split("/").pop() || "crop_leaf.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri,
        name: filename,
        type,
      } as any);

      formData.append("crop_name", cropName);

      if (weatherData.latitude)
        formData.append("latitude", String(weatherData.latitude));
      if (weatherData.longitude)
        formData.append("longitude", String(weatherData.longitude));
      formData.append("village", weatherData.locationName || "Local Farm");
      formData.append("block", "Main Block");
      formData.append("district", "Agri District");

      formData.append("temperature", String(weatherData.temperature));
      formData.append("humidity", String(weatherData.humidity));
      formData.append("weatherCondition", weatherData.condition);

      // 3. POST to your Express endpoint (/api/analysis/inspect)
      const response = await apiClient.post("/analysis/inspect", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success && response.data?.data) {
        setResult(response.data.data);
      } else {
        throw new Error(response.data?.message || "Unexpected server response");
      }
    } catch (error: any) {
      console.error(
        "Crop Analysis Error:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "Analysis Interrupted",
        error.response?.data?.message ||
          "Could not complete leaf diagnosis. Check your connection and try again.",
      );
    } finally {
      setAnalyzing(false);
      setStatusStep("");
    }
  };

  // Launch device camera immediately after crop selection
  const openCameraForCrop = async (cropName: string = selectedCrop) => {
    setSelectedCrop(cropName);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera Permission Needed",
        "Please allow camera access in settings to scan crop leaves.",
      );
      return;
    }

    const capture = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!capture.canceled && capture.assets?.[0]?.uri) {
      await processAndAnalyzeImage(capture.assets[0].uri, cropName);
    }
  };

  // Optional fallback: Pick existing photo from gallery
  const openGalleryForCrop = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Gallery Access Needed",
        "Please allow photo access to upload a leaf photo.",
      );
      return;
    }

    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!pick.canceled && pick.assets?.[0]?.uri) {
      await processAndAnalyzeImage(pick.assets[0].uri, selectedCrop);
    }
  };

  const resetScanner = () => {
    setImageUri(null);
    setResult(null);
    setAnalyzing(false);
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-stone-50">
      <StatusBar barStyle="dark-content" />

      {/* Top Navigation Bar */}
      <View className="px-5 py-3.5 bg-white border-b border-stone-200 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-stone-100 items-center justify-center"
        >
          <ArrowLeft size={20} color="#1c1917" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-base font-extrabold text-stone-900">
            Leaf Doctor
          </Text>
          <Text className="text-[11px] font-medium text-emerald-700">
            Selected: {selectedCrop}
          </Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* STATE 1: Crop Selection & Instant Camera Launch */}
        {!imageUri && !analyzing && (
          <>
            <View className="gap-1">
              <Text className="text-xl font-extrabold text-stone-900 tracking-tight">
                Which crop are you checking?
              </Text>
              <Text className="text-xs text-stone-500 leading-relaxed">
                Tap a crop below to open the camera immediately. GPS and local
                weather attach automatically.
              </Text>
            </View>

            {/* 2-Column Visual Crop Grid */}
            <View className="flex-row flex-wrap justify-between gap-y-3.5">
              {CROPS.map((item) => {
                const isSelected = selectedCrop === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    activeOpacity={0.85}
                    onPress={() => openCameraForCrop(item.name)}
                    className={`w-[48%] h-32 rounded-3xl overflow-hidden border-2 ${
                      isSelected ? "border-emerald-600" : "border-transparent"
                    }`}
                  >
                    <ImageBackground
                      source={{ uri: item.image }}
                      className="flex-1 justify-between p-3"
                      resizeMode="cover"
                    >
                      <View className="absolute inset-0 bg-stone-950/35" />

                      <View className="self-end bg-white/90 p-1.5 rounded-full">
                        <Camera size={14} color="#047857" />
                      </View>

                      <View>
                        <Text className="text-white font-extrabold text-base tracking-tight">
                          {item.name}
                        </Text>
                        <Text className="text-emerald-200 text-[11px] font-semibold">
                          Tap to scan →
                        </Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Primary Camera & Gallery Actions */}
            <View className="bg-white p-4 rounded-3xl border border-stone-200 gap-3 mt-1">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openCameraForCrop(selectedCrop)}
                className="bg-emerald-700 py-4 rounded-2xl flex-row items-center justify-center gap-2.5 shadow-sm"
              >
                <Camera size={20} color="#ffffff" />
                <Text className="text-white font-extrabold text-base">
                  Open Camera for {selectedCrop}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={openGalleryForCrop}
                className="bg-stone-100 py-3 rounded-2xl flex-row items-center justify-center gap-2"
              >
                <ImageIcon size={17} color="#44403c" />
                <Text className="text-stone-700 font-bold text-sm">
                  Upload from Photo Gallery
                </Text>
              </TouchableOpacity>
            </View>

            {/* Field Photography Tip Strip */}
            <View className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex-row items-start gap-3">
              <Leaf size={18} color="#b45309" className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-amber-950 font-bold text-xs">
                  Tip for Accurate Diagnosis
                </Text>
                <Text className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                  Hold the camera 15–20 cm away from a single affected leaf in
                  clear daylight so spots and lesions are sharp.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* STATE 2: Background Processing & Uploading */}
        {analyzing && imageUri && (
          <View className="bg-white rounded-3xl p-5 border border-stone-200 items-center gap-4">
            <View className="w-full h-64 rounded-2xl overflow-hidden bg-stone-100 relative">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-stone-950/45 items-center justify-center p-4">
                <View className="bg-white/95 px-5 py-4 rounded-2xl items-center gap-2.5">
                  <ActivityIndicator size="large" color="#059669" />
                  <Text className="text-stone-900 font-extrabold text-sm text-center">
                    {statusStep || "Processing Leaf Specimen..."}
                  </Text>
                  <Text className="text-stone-500 text-xs text-center">
                    Crop: {selectedCrop} · Auto-attaching weather & GPS
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STATE 3: Complete Diagnostic Report */}
        {!analyzing && result && imageUri && (
          <View className="gap-4">
            {/* Captured Image Header Card */}
            <View className="bg-white rounded-3xl overflow-hidden border border-stone-200">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-52"
                resizeMode="cover"
              />

              <View className="p-5 gap-3">
                {/* Status Pill + Confidence */}
                <View className="flex-row items-center justify-between">
                  <View
                    className={`px-3 py-1 rounded-full flex-row items-center gap-1.5 ${
                      result.diagnosis.is_healthy
                        ? "bg-emerald-100"
                        : "bg-amber-100"
                    }`}
                  >
                    {result.diagnosis.is_healthy ? (
                      <ShieldCheck size={14} color="#047857" />
                    ) : (
                      <AlertTriangle size={14} color="#b45309" />
                    )}
                    <Text
                      className={`text-xs font-extrabold uppercase ${
                        result.diagnosis.is_healthy
                          ? "text-emerald-800"
                          : "text-amber-900"
                      }`}
                    >
                      {result.diagnosis.is_healthy
                        ? "Healthy Crop"
                        : "Issue Detected"}
                    </Text>
                  </View>

                  <Text className="text-xs font-bold text-stone-500">
                    {result.diagnosis.confidence}% Match
                  </Text>
                </View>

                {/* Disease Title */}
                <View>
                  <Text className="text-xl font-extrabold text-stone-900">
                    {result.diagnosis.name}
                  </Text>
                  {result.diagnosis.scientific_name && (
                    <Text className="text-xs italic text-stone-500 mt-0.5">
                      {result.diagnosis.scientific_name}
                    </Text>
                  )}
                </View>

                {/* Tagged Telemetry Bar */}
                {telemetryMeta && (
                  <View className="flex-row items-center gap-2 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200/70">
                    <MapPin size={13} color="#059669" />
                    <Text className="text-xs text-stone-600 font-medium">
                      {telemetryMeta.location} · {telemetryMeta.temp}°C ·{" "}
                      {result.crop.name}
                    </Text>
                  </View>
                )}

                <Text className="text-stone-600 text-xs leading-relaxed">
                  {result.diagnosis.description}
                </Text>
              </View>
            </View>

            {/* Treatment & Action Plan Card */}
            {!result.diagnosis.is_healthy && (
              <View className="bg-white rounded-3xl p-5 border border-stone-200 gap-4">
                <Text className="text-base font-extrabold text-stone-900">
                  Recommended Treatment
                </Text>

                {/* Treatment Category Switcher */}
                <View className="flex-row bg-stone-100 p-1 rounded-2xl">
                  {(
                    [
                      { key: "biological", label: "Organic", icon: Sprout },
                      {
                        key: "chemical",
                        label: "Chemical",
                        icon: FlaskConical,
                      },
                      {
                        key: "prevention",
                        label: "Prevent",
                        icon: ShieldAlert,
                      },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTreatmentTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTreatmentTab(tab.key)}
                        className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
                          active ? "bg-white shadow-sm" : ""
                        }`}
                      >
                        <Icon
                          size={14}
                          color={active ? "#047857" : "#78716c"}
                        />
                        <Text
                          className={`text-xs font-bold ${
                            active ? "text-emerald-800" : "text-stone-600"
                          }`}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Treatment Bullet List */}
                <View className="gap-2.5">
                  {(result.treatments?.[activeTreatmentTab]?.length
                    ? result.treatments[activeTreatmentTab]
                    : [
                        "Consult your local Krishi Kendra officer for specific dosage guidance.",
                      ]
                  ).map((step, idx) => (
                    <View
                      key={idx}
                      className="flex-row items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-100"
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
                  ))}
                </View>
              </View>
            )}

            {/* Scan Another Leaf Button */}
            <TouchableOpacity
              onPress={resetScanner}
              activeOpacity={0.85}
              className="bg-emerald-700 py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw size={18} color="#ffffff" />
              <Text className="text-white font-extrabold text-base">
                Scan Another Leaf
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
