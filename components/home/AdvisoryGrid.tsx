import { BookOpen, Microscope } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

export default function AdvisoryGrid() {
  return (
    <View className="gap-3">
      <Text className="text-base font-extrabold text-slate-900">
        Advisory & Tools
      </Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-1 bg-white p-4 rounded-2xl border border-emerald-100 gap-2 shadow-sm"
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
          className="flex-1 bg-white p-4 rounded-2xl border border-emerald-100 gap-2 shadow-sm"
        >
          <View className="w-10 h-10 bg-emerald-50 rounded-xl items-center justify-center">
            <BookOpen size={20} color="#059669" />
          </View>
          <Text className="text-slate-900 font-bold text-sm">Pest Library</Text>
          <Text className="text-slate-500 text-xs leading-snug">
            Browse organic & chemical treatments
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
