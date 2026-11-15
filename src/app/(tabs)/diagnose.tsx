import { Camera, Image as ImageIcon } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DiagnoseScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-white items-center justify-between px-6 pb-12"
    >
      <View className="items-center mt-6">
        <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Crop Scanner
        </Text>
        <Text className="text-slate-500 text-sm mt-1 text-center">
          Position affected leaves or stems within the frame for instant AI
          analysis.
        </Text>
      </View>

      {/* Camera Viewfinder Placeholder Frame */}
      <View className="w-full h-96 bg-slate-900 rounded-3xl items-center justify-center border-4 border-emerald-500/30 relative overflow-hidden">
        <View className="absolute inset-4 border border-dashed border-emerald-400/40 rounded-2xl items-center justify-center">
          <Camera size={48} color="#34d399" />
          <Text className="text-emerald-300 text-xs font-mono mt-3">
            AI Vision Engine Active
          </Text>
        </View>
      </View>

      {/* Action Controls */}
      <View className="w-full gap-3">
        <TouchableOpacity className="w-full bg-emerald-600 py-4 rounded-2xl items-center justify-center shadow-sm">
          <Text className="text-white font-extrabold text-base">
            Capture Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="w-full bg-emerald-50 py-3.5 rounded-2xl items-center justify-center border border-emerald-200 flex-row gap-2">
          <ImageIcon size={18} color="#047857" />
          <Text className="text-emerald-800 font-bold text-sm">
            Upload from Gallery
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
