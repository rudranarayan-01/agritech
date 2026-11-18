import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ArrowLeft, Camera, ImageIcon, Leaf } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function CropInspectScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [statusStep, setStatusStep] = useState<string>("");

  const processAndAnalyzeImage = async (uri: string, cropName: string) => {
    setAnalyzing(true);

    try {
      setStatusStep("Tagging accurate GPS & local weather...");
      const weatherData = await fetchLocalWeatherAndLocation();

      setStatusStep(`Analyzing ${cropName} leaf tissue via AI...`);
      const formData = new FormData();

      const filename = uri.split("/").pop() || "crop_leaf.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", { uri, name: filename, type } as any);
      formData.append("crop_name", cropName);

      if (weatherData.latitude)
        formData.append("latitude", String(weatherData.latitude));
      if (weatherData.longitude)
        formData.append("longitude", String(weatherData.longitude));

      // Real geocoded fields
      formData.append("village", weatherData.village);
      formData.append("block", weatherData.block);
      formData.append("district", weatherData.district);

      formData.append("temperature", String(weatherData.temperature));
      formData.append("humidity", String(weatherData.humidity));
      formData.append("weatherCondition", weatherData.condition);

      const response = await apiClient.post("/analysis/inspect", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success && response.data?.data) {
        // Redirect to result screen with serialized response and image uri
        router.navigate({
          pathname: "/inspection-result",
          params: {
            resultData: JSON.stringify(response.data.data),
            imageUri: uri,
            location: weatherData.locationName,
            temp: weatherData.temperature,
          },
        });
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
          "Could not complete leaf diagnosis. Try again.",
      );
    } finally {
      setAnalyzing(false);
      setStatusStep("");
    }
  };

  const openCameraForCrop = async (cropName: string = selectedCrop) => {
    setSelectedCrop(cropName);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Needed", "Please allow camera access.");
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

  const openGalleryForCrop = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Needed", "Please allow photo access.");
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

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-stone-50">
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
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
        {analyzing ? (
          <View className="bg-white rounded-3xl p-8 border border-stone-200 items-center justify-center gap-4 mt-20">
            <ActivityIndicator size="large" color="#059669" />
            <Text className="text-stone-900 font-extrabold text-base text-center">
              {statusStep || "Processing Specimen..."}
            </Text>
            <Text className="text-stone-500 text-xs text-center">
              Target Crop: {selectedCrop}
            </Text>
          </View>
        ) : (
          <>
            <View className="gap-1">
              <Text className="text-xl font-extrabold text-stone-900 tracking-tight">
                Which crop are you checking?
              </Text>
              <Text className="text-xs text-stone-500 leading-relaxed">
                Select your crop and take a picture. Precise GPS & weather are
                tagged automatically.
              </Text>
            </View>

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

            <View className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex-row items-start gap-3">
              <Leaf size={18} color="#b45309" className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-amber-950 font-bold text-xs">
                  Field Tip
                </Text>
                <Text className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                  Keep the camera 15–20 cm away from the affected leaf in good
                  daylight.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
