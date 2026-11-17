import { Leaf } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Crop {
  id: string;
  name: string;
  stage: string;
  health: string;
}

interface CropCarouselProps {
  crops: Crop[];
  selectedCropId: string;
  onSelectCrop: (id: string) => void;
  onAddCropPress?: () => void;
}

export default function CropCarousel({
  crops,
  selectedCropId,
  onSelectCrop,
  onAddCropPress,
}: CropCarouselProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-extrabold text-slate-900">
          Your Monitored Crops
        </Text>
        <TouchableOpacity onPress={onAddCropPress}>
          <Text className="text-xs font-bold text-emerald-700">+ Add Crop</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {crops.map((crop) => {
            const isSelected = selectedCropId === crop.id;
            return (
              <TouchableOpacity
                key={crop.id}
                onPress={() => onSelectCrop(crop.id)}
                activeOpacity={0.8}
                className={`w-32 p-3.5 rounded-2xl border ${
                  isSelected
                    ? "bg-emerald-600 border-emerald-600"
                    : "bg-white border-emerald-100 shadow-sm"
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
                  className={`font-bold text-sm ${isSelected ? "text-white" : "text-slate-900"}`}
                >
                  {crop.name}
                </Text>
                <Text
                  className={`text-[11px] mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-500"}`}
                >
                  {crop.stage}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
