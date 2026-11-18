import { Leaf, Plus, Sprout } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Crop {
  id: string;
  name: string;
  stage: string;
  health?: string;
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
      {/* Section Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-extrabold text-slate-900 tracking-tight">
            Monitored Crops
          </Text>
          {crops.length > 0 && (
            <View className="bg-emerald-100/70 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-extrabold text-emerald-800">
                {crops.length} ACTIVE
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={onAddCropPress}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60"
        >
          <Plus size={13} color="#047857" />
          <Text className="text-xs font-bold text-emerald-700">Add Crop</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State Guard */}
      {!crops || crops.length === 0 ? (
        <TouchableOpacity
          onPress={onAddCropPress}
          activeOpacity={0.8}
          className="bg-white p-4 rounded-2xl border border-dashed border-emerald-300 flex-row items-center justify-center gap-3"
        >
          <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
            <Sprout size={18} color="#059669" />
          </View>
          <View>
            <Text className="text-slate-800 font-bold text-sm">
              No crops added yet
            </Text>
            <Text className="text-slate-400 text-xs">
              Tap here to register your first parcel
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 4 }}
        >
          {crops.map((crop) => {
            const isSelected = selectedCropId === crop.id;
            const hasAlert = crop.health === "Alert";

            return (
              <TouchableOpacity
                key={crop.id}
                onPress={() => onSelectCrop(crop.id)}
                activeOpacity={0.8}
                className={`w-36 p-4 rounded-2xl border justify-between shadow-2xs ${
                  isSelected
                    ? "bg-emerald-700 border-emerald-700"
                    : "bg-white border-slate-100/80"
                }`}
                style={{ minHeight: 110 }}
              >
                {/* Top Row: Icon & Status Dot */}
                <View className="flex-row items-center justify-between">
                  <View
                    className={`w-9 h-9 rounded-xl items-center justify-center ${
                      isSelected ? "bg-emerald-600/90" : "bg-emerald-50"
                    }`}
                  >
                    <Leaf
                      size={17}
                      color={isSelected ? "#ecfdf5" : "#059669"}
                    />
                  </View>

                  {hasAlert ? (
                    <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <View className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <Text className="text-[10px] font-bold text-amber-800">
                        Alert
                      </Text>
                    </View>
                  ) : (
                    <View
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? "bg-emerald-400" : "bg-emerald-500"
                      }`}
                    />
                  )}
                </View>

                {/* Bottom Row: Crop Name & Stage */}
                <View className="mt-3">
                  <Text
                    className={`font-bold text-sm tracking-tight ${
                      isSelected ? "text-white" : "text-slate-900"
                    }`}
                    numberOfLines={1}
                  >
                    {crop.name}
                  </Text>
                  <Text
                    className={`text-[11px] font-medium mt-0.5 ${
                      isSelected ? "text-emerald-100/90" : "text-slate-500"
                    }`}
                    numberOfLines={1}
                  >
                    {crop.stage}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
