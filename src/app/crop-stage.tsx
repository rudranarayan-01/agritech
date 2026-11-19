import { router, useLocalSearchParams } from "expo-router";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Calculator,
    CheckCircle2,
    Clock,
    CloudRain,
    Sprout,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../services/api";

interface StageItem {
  code: string;
  name: string;
  startDay: number;
  endDay: number;
  summary: string;
  keyActions: string[];
  status: "COMPLETED" | "CURRENT" | "UPCOMING";
}

interface CropStageEvaluation {
  crop: string;
  cropKey: string;
  daysAfterSowing: number;
  totalDays: number;
  daysRemainingInCycle: number;
  progressPercent: number;
  currentStage: StageItem;
  nextStage: {
    code: string;
    name: string;
    startDay: number;
    endDay: number;
  } | null;
  stages: StageItem[];
}

const DEFAULT_CROPS = [
  { key: "wheat", label: "Wheat", totalDays: 120 },
  { key: "paddy", label: "Paddy (Rice)", totalDays: 125 },
  { key: "soybean", label: "Soybean", totalDays: 95 },
  { key: "potato", label: "Potato", totalDays: 100 },
  { key: "tomato", label: "Tomato", totalDays: 110 },
  { key: "maize", label: "Maize", totalDays: 105 },
];

const QUICK_DAYS = [10, 25, 45, 70, 95] as const;

export default function CropStageScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    cropName?: string;
    plotArea?: string;
    landUnit?: string;
  }>();

  const [crops, setCrops] = useState(DEFAULT_CROPS);
  const [selectedCrop, setSelectedCrop] = useState<string>(
    params.cropName || "Wheat",
  );
  const [daysInput, setDaysInput] = useState<string>("25");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<CropStageEvaluation | null>(
    null,
  );

  useEffect(() => {
    const loadCrops = async () => {
      try {
        const res = await apiClient.get("/crop-stage/crops");
        if (
          res.data?.success &&
          Array.isArray(res.data.data) &&
          res.data.data.length > 0
        ) {
          setCrops(res.data.data);
        }
      } catch {
        // Keep DEFAULT_CROPS fallback if offline or unauthenticated on initial load
      }
    };
    loadCrops();
  }, []);

  const runEvaluation = useCallback(
    async (cropLabel: string, rawDays: string) => {
      setErrorMsg(null);
      const parsedDays = Number(rawDays);
      if (!Number.isFinite(parsedDays) || parsedDays < 0 || parsedDays > 365) {
        setErrorMsg("Enter valid Days After Sowing (0 to 365).");
        return;
      }

      try {
        setLoading(true);
        const res = await apiClient.post("/crop-stage/evaluate", {
          cropName: cropLabel,
          daysAfterSowing: Math.floor(parsedDays),
        });

        if (res.data?.success && res.data?.data) {
          setEvaluation(res.data.data);
        } else {
          setErrorMsg(res.data?.message || "Could not evaluate crop stage.");
        }
      } catch (err: any) {
        setErrorMsg(
          err.response?.data?.message || "Failed to evaluate crop stage.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    runEvaluation(selectedCrop, daysInput);
  }, []);

  const handleSelectCrop = (label: string) => {
    setSelectedCrop(label);
    runEvaluation(label, daysInput);
  };

  const handleSelectQuickDay = (dayVal: number) => {
    const asStr = String(dayVal);
    setDaysInput(asStr);
    runEvaluation(selectedCrop, asStr);
  };

  const handleOpenFertilizerCalc = () => {
    router.push({
      pathname: "/fertilizer-calculator" as any,
      params: {
        cropName: evaluation?.crop || selectedCrop,
        ...(params.plotArea ? { plotArea: params.plotArea } : {}),
        ...(params.landUnit ? { landUnit: params.landUnit } : {}),
      },
    });
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white px-5 py-3.5 border-b border-slate-200/80 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.75}
          className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
        >
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-slate-900">
            Crop Stage Tracker
          </Text>
          <Text className="text-xs text-slate-500">
            Growth phase, critical care & harvest timeline
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Crop & Crop Age Input Card */}
        <View className="bg-white p-4 rounded-2xl border border-slate-200/80 gap-4">
          <View>
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Crop
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {crops.map((item) => {
                  const active =
                    selectedCrop.toLowerCase() === item.label.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => handleSelectCrop(item.label)}
                      activeOpacity={0.8}
                      className={`px-3.5 py-2 rounded-xl border ${
                        active
                          ? "bg-emerald-700 border-emerald-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          active ? "text-white" : "text-slate-700"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Days After Sowing / Transplanting */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Days Since Sowing / Planting
              </Text>
              <Text className="text-[11px] font-semibold text-slate-400">
                DAS / DAT
              </Text>
            </View>

            <View className="flex-row gap-2.5">
              <TextInput
                value={daysInput}
                onChangeText={setDaysInput}
                keyboardType="number-pad"
                placeholder="e.g. 25"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
              />
              <TouchableOpacity
                onPress={() => runEvaluation(selectedCrop, daysInput)}
                disabled={loading}
                activeOpacity={0.85}
                className="bg-emerald-700 px-4 rounded-xl items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-extrabold text-xs">
                    Update Stage
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Day Presets */}
            <View className="flex-row gap-2 pt-1">
              {QUICK_DAYS.map((d) => {
                const isCurrentDay = Number(daysInput) === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => handleSelectQuickDay(d)}
                    activeOpacity={0.8}
                    className={`flex-1 py-1.5 rounded-lg border items-center ${
                      isCurrentDay
                        ? "bg-slate-900 border-slate-900"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isCurrentDay ? "text-white" : "text-slate-600"
                      }`}
                    >
                      Day {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {errorMsg && (
            <View className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex-row items-center gap-2">
              <AlertCircle size={16} color="#e11d48" />
              <Text className="text-xs font-semibold text-rose-800 flex-1">
                {errorMsg}
              </Text>
            </View>
          )}
        </View>

        {evaluation && (
          <View className="gap-5">
            {/* Cycle Progress Overview Card */}
            <View className="bg-white p-4 rounded-2xl border border-slate-200/80 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Sprout size={17} color="#047857" />
                  <Text className="text-sm font-extrabold text-slate-900">
                    {evaluation.crop} · Day {evaluation.daysAfterSowing}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-emerald-800">
                  {evaluation.progressPercent}% Cycle
                </Text>
              </View>

              {/* Progress Bar */}
              <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <View
                  style={{ width: `${evaluation.progressPercent}%` }}
                  className="h-full bg-emerald-600 rounded-full"
                />
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] text-slate-500">
                  Est. cycle: ~{evaluation.totalDays} days
                </Text>
                <Text className="text-[11px] font-semibold text-slate-600">
                  {evaluation.daysRemainingInCycle > 0
                    ? `~${evaluation.daysRemainingInCycle} days to maturity`
                    : "Maturity window reached"}
                </Text>
              </View>
            </View>

            {/* Active Stage & Field Actions */}
            <View className="bg-white p-4 rounded-2xl border border-emerald-200 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                    Current Stage · Days {evaluation.currentStage.startDay}–
                    {evaluation.currentStage.endDay}
                  </Text>
                </View>
              </View>

              <Text className="text-base font-extrabold text-slate-900">
                {evaluation.currentStage.name}
              </Text>
              <Text className="text-xs text-slate-600 leading-relaxed">
                {evaluation.currentStage.summary}
              </Text>

              <View className="gap-2 pt-2 border-t border-slate-100">
                <Text className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Key Field Priorities Right Now
                </Text>
                {evaluation.currentStage.keyActions.map((act, idx) => (
                  <View key={idx} className="flex-row items-start gap-2">
                    <CheckCircle2
                      size={15}
                      color="#047857"
                      style={{ marginTop: 2 }}
                    />
                    <Text className="text-xs text-slate-700 flex-1 leading-relaxed">
                      {act}
                    </Text>
                  </View>
                ))}
              </View>

              {evaluation.nextStage && (
                <View className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl flex-row items-center justify-between mt-1">
                  <View className="flex-1 pr-2">
                    <Text className="text-[10px] font-extrabold text-slate-400 uppercase">
                      Up Next (Day {evaluation.nextStage.startDay}+)
                    </Text>
                    <Text className="text-xs font-bold text-slate-800 mt-0.5">
                      {evaluation.nextStage.name}
                    </Text>
                  </View>
                  <Clock size={15} color="#64748b" />
                </View>
              )}
            </View>

            {/* Full Growth Stage Timeline */}
            <View className="gap-2.5">
              <Text className="text-sm font-extrabold text-slate-900">
                Full Growth Timeline
              </Text>

              {evaluation.stages.map((st, index) => {
                const isCurrent = st.status === "CURRENT";
                const isDone = st.status === "COMPLETED";

                return (
                  <View
                    key={st.code}
                    className={`p-3.5 rounded-2xl border ${
                      isCurrent
                        ? "bg-emerald-50/50 border-emerald-300"
                        : "bg-white border-slate-200/80"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-xs font-extrabold ${
                          isCurrent
                            ? "text-emerald-900"
                            : isDone
                              ? "text-slate-700"
                              : "text-slate-500"
                        }`}
                      >
                        {index + 1}. {st.name}
                      </Text>
                      <Text className="text-[11px] font-bold text-slate-500">
                        Day {st.startDay}–{st.endDay}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-slate-500 mt-1">
                      {st.summary}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Quick Actions into Related Advisory Tools */}
            <View className="gap-2.5">
              <TouchableOpacity
                onPress={handleOpenFertilizerCalc}
                activeOpacity={0.85}
                className="bg-slate-900 p-4 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <Calculator size={18} color="#34d399" />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-white">
                      Check Fertilizer & Split Dose for {evaluation.crop}
                    </Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5">
                      Basal & top-dress bag quantities
                    </Text>
                  </View>
                </View>
                <ArrowRight size={17} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/spray-window" as any)}
                activeOpacity={0.85}
                className="bg-white border border-slate-200/80 p-3.5 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5">
                  <CloudRain size={17} color="#0284c7" />
                  <Text className="text-xs font-bold text-slate-800">
                    Check Spray Window Before Field Application
                  </Text>
                </View>
                <ArrowRight size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
