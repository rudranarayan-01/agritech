import {
  AlertTriangle,
  ChevronRight,
  Clock,
  ShieldCheck,
} from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface ScanItem {
  id: string;
  crop: string;
  diagnosis: string;
  confidence: string;
  date: string;
  severity: "high" | "healthy";
}

interface RecentScansListProps {
  scans: ScanItem[];
  onViewAllPress?: () => void;
  onScanPress?: (id: string) => void;
}

export default function RecentScansList({
  scans,
  onViewAllPress,
  onScanPress,
}: RecentScansListProps) {
  // Empty state guard handled gracefully
  if (!scans || scans.length === 0) {
    return (
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-extrabold text-slate-900 tracking-tight">
            Recent Diagnostics
          </Text>
        </View>
        <View className="bg-white p-6 rounded-2xl border border-emerald-100/80 items-center justify-center shadow-sm">
          <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-2.5">
            <Clock size={22} color="#059669" />
          </View>
          <Text className="text-slate-800 font-bold text-sm">
            No scans recorded yet
          </Text>
          <Text className="text-slate-400 text-xs text-center mt-1">
            Take a picture of your crop above to run your first AI health
            analysis.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-extrabold text-slate-900 tracking-tight">
          Recent Diagnostics
        </Text>
        {onViewAllPress && (
          <TouchableOpacity onPress={onViewAllPress} activeOpacity={0.7}>
            <Text className="text-xs font-bold text-emerald-700">View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="gap-2.5">
        {scans.map((scan) => {
          const isHighRisk = scan.severity === "high";
          return (
            <TouchableOpacity
              key={scan.id}
              onPress={() => onScanPress?.(scan.id)}
              activeOpacity={0.75}
              className={`bg-white p-3.5 rounded-2xl border flex-row items-center justify-between shadow-sm ${
                isHighRisk
                  ? "border-amber-200/60 bg-amber-50/20"
                  : "border-slate-100"
              }`}
            >
              <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                {/* Status Icon Indicator */}
                <View
                  className={`w-11 h-11 rounded-xl items-center justify-center shrink-0 shadow-2xs ${
                    isHighRisk
                      ? "bg-amber-100/70 border border-amber-200/50"
                      : "bg-emerald-100/60 border border-emerald-200/50"
                  }`}
                >
                  {isHighRisk ? (
                    <AlertTriangle size={20} color="#b45309" />
                  ) : (
                    <ShieldCheck size={20} color="#047857" />
                  )}
                </View>

                {/* Text Metadata */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-slate-900 font-bold text-sm shrink capitalize"
                      numberOfLines={1}
                    >
                      {scan.diagnosis}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Text className="text-emerald-800 font-semibold text-xs">
                      {scan.crop}
                    </Text>
                    <Text className="text-slate-300">·</Text>
                    <Text className="text-slate-500 text-xs" numberOfLines={1}>
                      {scan.date}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right Action / Confidence Pill */}
              <View className="flex-row items-center gap-2 shrink-0">
                <View
                  className={`px-2.5 py-1 rounded-lg border flex-row items-center gap-1 ${
                    isHighRisk
                      ? "bg-amber-50 border-amber-200"
                      : "bg-emerald-50 border-emerald-200/60"
                  }`}
                >
                  <View
                    className={`w-1.5 h-1.5 rounded-full ${
                      isHighRisk ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                  />
                  <Text
                    className={`text-[11px] font-bold ${
                      isHighRisk ? "text-amber-800" : "text-emerald-800"
                    }`}
                  >
                    {scan.confidence}
                  </Text>
                </View>
                <ChevronRight size={15} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
