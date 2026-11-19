import { router } from "expo-router";
import {
  Calculator,
  CloudRain,
  FlaskConical,
  Sprout,
} from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface SelectedCropParcel {
  cropName?: string;
  plotArea?: number;
  landUnit?: string;
}

interface AdvisoryGridProps {
  selectedCrop?: SelectedCropParcel | null;
  weatherCondition?: string;
}

export default function AdvisoryGrid({
  selectedCrop,
  weatherCondition,
}: AdvisoryGridProps) {
  const handleOpenFertilizerCalc = () => {
    router.push({
      pathname: "/fertilizer-calculator" as any,
      params: {
        ...(selectedCrop?.cropName ? { cropName: selectedCrop.cropName } : {}),
        ...(selectedCrop?.plotArea
          ? { plotArea: String(selectedCrop.plotArea) }
          : {}),
        ...(selectedCrop?.landUnit ? { landUnit: selectedCrop.landUnit } : {}),
        ...(weatherCondition ? { weatherCondition } : {}),
      },
    });
  };

  return (
    <View className="gap-3">
      <Text className="text-base font-extrabold text-slate-900 tracking-tight">
        Advisory & Tools
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {/* Fertilizer Calculator Tile */}
        <TouchableOpacity
          onPress={handleOpenFertilizerCalc}
          activeOpacity={0.8}
          className="w-[48%] bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs gap-2.5"
        >
          <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
            <Calculator size={20} color="#047857" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-900">
              Fertilizer Calc
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
              {selectedCrop?.cropName
                ? `Plan for ${selectedCrop.cropName}`
                : "NPK & 50kg bag split"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Soil Health Tile */}
        <TouchableOpacity
          onPress={() => router.push("/soil-advisory" as any)}
          activeOpacity={0.8}
          className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs gap-2.5"
        >
          <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
            <FlaskConical size={20} color="#b45309" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-900">
              Soil Advisory
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
              Nutrient & pH guide
            </Text>
          </View>
        </TouchableOpacity>

        {/* Crop Calendar / Crop Stage Tile */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/crop-stage" as any,
              params: {
                ...(selectedCrop?.cropName
                  ? { cropName: selectedCrop.cropName }
                  : {}),
                ...(selectedCrop?.plotArea
                  ? { plotArea: String(selectedCrop.plotArea) }
                  : {}),
                ...(selectedCrop?.landUnit
                  ? { landUnit: selectedCrop.landUnit }
                  : {}),
              },
            })
          }
          activeOpacity={0.8}
          className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs gap-2.5"
        >
          <View className="w-10 h-10 rounded-xl bg-sky-50 items-center justify-center">
            <Sprout size={20} color="#0369a1" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-900">Crop Stage</Text>
            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
              Growth & harvest tracker
            </Text>
          </View>
        </TouchableOpacity>

        {/* Weather Alerts / Spray Window Tile */}
        <TouchableOpacity
          onPress={() => router.push("/spray-window" as any)}
          activeOpacity={0.8}
          className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs gap-2.5"
        >
          <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center">
            <CloudRain size={20} color="#4338ca" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-900">
              Spray Window
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
              Rain & wind forecast
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
