import { BookOpen, Search, ShieldAlert } from "lucide-react-native";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white">
      <View className="px-5 pt-3 pb-4 border-b border-emerald-100">
        <Text className="text-xl font-extrabold text-slate-900">
          Pest & Disease Library
        </Text>
        <Text className="text-xs text-slate-500">
          Comprehensive agronomy database
        </Text>

        <View className="mt-4 flex-row items-center bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 gap-2.5">
          <Search size={18} color="#64748b" />
          <TextInput
            placeholder="Search diseases, pests, or crops..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-900 text-sm font-medium"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerClassName="p-5 gap-3"
      >
        <View className="bg-white p-4 rounded-2xl border border-emerald-100 flex-row items-center gap-4">
          <View className="w-12 h-12 bg-amber-50 rounded-xl items-center justify-center">
            <ShieldAlert size={22} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-base">
              Early Blight (Alternaria)
            </Text>
            <Text className="text-slate-500 text-xs mt-0.5">
              Affects: Tomatoes, Potatoes
            </Text>
          </View>
        </View>

        <View className="bg-white p-4 rounded-2xl border border-emerald-100 flex-row items-center gap-4">
          <View className="w-12 h-12 bg-emerald-50 rounded-xl items-center justify-center">
            <BookOpen size={22} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-base">
              Powdery Mildew
            </Text>
            <Text className="text-slate-500 text-xs mt-0.5">
              Affects: Cucurbits, Grapes
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
