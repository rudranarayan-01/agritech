import {
    AlertTriangle,
    Bell,
    BookOpen,
    Camera,
    ChevronRight,
    CloudSun,
    Droplets,
    Leaf,
    Microscope,
    ShieldCheck,
    Sprout,
    Wind,
} from "lucide-react-native";
import { useState } from "react";
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MY_CROPS = [
  { id: "1", name: "Tomato", stage: "Flowering", health: "Healthy" },
  { id: "2", name: "Wheat", stage: "Tillering", health: "Alert" },
  { id: "3", name: "Potato", stage: "Vegetative", health: "Healthy" },
  { id: "4", name: "Rice", stage: "Seedling", health: "Healthy" },
];

const RECENT_SCANS = [
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
  const insets = useSafeAreaInsets();

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
        contentContainerClassName="px-5 pt-5 pb-12 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Primary Hero Card */}
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
            className="mt-5 bg-white py-3.5 px-5 rounded-2xl flex-row items-center justify-center gap-2.5"
          >
            <Camera size={20} color="#047857" />
            <Text className="text-emerald-800 font-extrabold text-base">
              Take a Picture
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Field Telemetry & Weather Strip */}
        <View className="bg-white rounded-2xl p-4 border border-emerald-100 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 bg-emerald-50 rounded-xl items-center justify-center border border-emerald-100">
              <CloudSun size={24} color="#059669" />
            </View>
            <View>
              <Text className="text-slate-900 font-bold text-base">
                28°C · Clear Sky
              </Text>
              <Text className="text-slate-500 text-xs">
                Ideal spraying conditions today
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="items-center">
              <View className="flex-row items-center gap-1">
                <Droplets size={13} color="#059669" />
                <Text className="text-slate-800 font-bold text-xs">64%</Text>
              </View>
              <Text className="text-slate-400 text-[10px]">Humidity</Text>
            </View>
            <View className="items-center">
              <View className="flex-row items-center gap-1">
                <Wind size={13} color="#059669" />
                <Text className="text-slate-800 font-bold text-xs">
                  12 km/h
                </Text>
              </View>
              <Text className="text-slate-400 text-[10px]">Wind</Text>
            </View>
          </View>
        </View>

        {/* 3. Active Crops Selector */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-slate-900">
              Your Monitored Crops
            </Text>
            <TouchableOpacity>
              <Text className="text-xs font-bold text-emerald-700">
                + Add Crop
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            <View className="flex-row gap-3">
              {MY_CROPS.map((crop) => {
                const isSelected = selectedCrop === crop.id;
                return (
                  <TouchableOpacity
                    key={crop.id}
                    onPress={() => setSelectedCrop(crop.id)}
                    activeOpacity={0.8}
                    className={`w-32 p-3.5 rounded-2xl border ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600"
                        : "bg-white border-emerald-100"
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View
                        className={`w-8 h-8 rounded-lg items-center justify-center ${
                          isSelected ? "bg-emerald-500" : "bg-emerald-50"
                        }`}
                      >
                        <Leaf
                          size={16}
                          color={isSelected ? "#ffffff" : "#059669"}
                        />
                      </View>
                      {crop.health === "Alert" && (
                        <View className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      )}
                    </View>
                    <Text
                      className={`font-bold text-sm ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {crop.name}
                    </Text>
                    <Text
                      className={`text-[11px] mt-0.5 ${
                        isSelected ? "text-emerald-100" : "text-slate-500"
                      }`}
                    >
                      {crop.stage}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* 4. Quick Advisory Tools Grid */}
        <View className="gap-3">
          <Text className="text-base font-extrabold text-slate-900">
            Advisory & Tools
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 bg-white p-4 rounded-2xl border border-emerald-100 gap-2"
            >
              <View className="w-10 h-10 bg-emerald-50 rounded-xl items-center justify-center">
                <Microscope size={20} color="#059669" />
              </View>
              <Text className="text-slate-900 font-bold text-sm">
                Fertilizer Calc
              </Text>
              <Text className="text-slate-500 text-xs leading-snug">
                NPK dosage tailored to plot acreage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 bg-white p-4 rounded-2xl border border-emerald-100 gap-2"
            >
              <View className="w-10 h-10 bg-emerald-50 rounded-xl items-center justify-center">
                <BookOpen size={20} color="#059669" />
              </View>
              <Text className="text-slate-900 font-bold text-sm">
                Pest Library
              </Text>
              <Text className="text-slate-500 text-xs leading-snug">
                Browse organic & chemical treatments
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Recent Diagnostic History */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-extrabold text-slate-900">
              Recent Diagnostics
            </Text>
            <TouchableOpacity>
              <Text className="text-xs font-bold text-emerald-700">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View className="gap-2.5">
            {RECENT_SCANS.map((scan) => (
              <TouchableOpacity
                key={scan.id}
                activeOpacity={0.8}
                className="bg-white p-4 rounded-2xl border border-emerald-100 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3.5">
                  <View
                    className={`w-11 h-11 rounded-xl items-center justify-center ${
                      scan.severity === "high" ? "bg-amber-50" : "bg-emerald-50"
                    }`}
                  >
                    {scan.severity === "high" ? (
                      <AlertTriangle size={20} color="#d97706" />
                    ) : (
                      <ShieldCheck size={20} color="#059669" />
                    )}
                  </View>
                  <View>
                    <Text className="text-slate-900 font-bold text-sm">
                      {scan.diagnosis}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">
                      {scan.crop} · {scan.date}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-1.5">
                  <View className="bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <Text className="text-emerald-700 text-[11px] font-bold">
                      {scan.confidence}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
