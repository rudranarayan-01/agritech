import { AlertTriangle, ChevronRight, ShieldCheck } from "lucide-react-native";
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
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-extrabold text-slate-900">
          Recent Diagnostics
        </Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text className="text-xs font-bold text-emerald-700">View All</Text>
        </TouchableOpacity>
      </View>

      <View className="gap-2.5">
        {scans.map((scan) => (
          <TouchableOpacity
            key={scan.id}
            onPress={() => onScanPress?.(scan.id)}
            activeOpacity={0.8}
            className="bg-white p-4 rounded-2xl border border-emerald-100 flex-row items-center justify-between shadow-sm"
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
  );
}
