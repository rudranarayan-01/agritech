import { router } from "expo-router";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    FlaskConical,
    Layers,
    ShieldAlert,
    Sparkles,
} from "lucide-react-native";
import { useState } from "react";
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

type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

interface NutrientStatus {
  status: "LOW" | "MEDIUM" | "HIGH";
  value: number;
}

interface SoilRecommendation {
  title: string;
  action: string;
  priority: PriorityLevel;
}

interface SoilAdvisoryData {
  soilType: string;
  modeUsed: "SOIL_HEALTH_CARD" | "FIELD_OBSERVATION";
  ph: {
    value: number | null;
    status: string;
    summary: string;
  };
  organicCarbon: NutrientStatus | null;
  nutrients: {
    nitrogen: NutrientStatus | null;
    phosphorus: NutrientStatus | null;
    potassium: NutrientStatus | null;
  };
  deficiencies: string[];
  recommendations: SoilRecommendation[];
  fertilizerHandoff: {
    soilTest: { n?: number; p?: number; k?: number };
  } | null;
}

const SOIL_TYPES = [
  "Alluvial",
  "Black",
  "Red / Laterite",
  "Sandy Loam",
  "Clay",
] as const;

const DRAINAGE_OPTIONS = [
  { label: "Normal", value: "" },
  { label: "Holds Moisture", value: "Slow / Holds Moisture" },
  { label: "Fast Drainage", value: "Fast Drainage" },
  { label: "Waterlogged", value: "Waterlogged" },
] as const;

const OBSERVATION_OPTIONS = [
  { label: "None / Routine", value: "" },
  { label: "Yellow / Pale Leaves", value: "Pale or yellow leaves" },
  { label: "Stunted Growth", value: "Stunted growth" },
  { label: "Hard / Crusted Top", value: "Hard / crusted surface" },
] as const;

export default function SoilAdvisoryScreen() {
  const insets = useSafeAreaInsets();

  const [soilType, setSoilType] = useState<string>("Alluvial");
  const [drainage, setDrainage] = useState<string>("");
  const [observation, setObservation] = useState<string>("");

  const [showLabCard, setShowLabCard] = useState<boolean>(false);
  const [ph, setPh] = useState<string>("");
  const [organicCarbon, setOrganicCarbon] = useState<string>("");
  const [nitrogen, setNitrogen] = useState<string>("");
  const [phosphorus, setPhosphorus] = useState<string>("");
  const [potassium, setPotassium] = useState<string>("");
  const [micronutrientNotes, setMicronutrientNotes] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState<SoilAdvisoryData | null>(null);

  const handleAnalyzeSoil = async () => {
    setErrorMsg(null);

    const payload: Record<string, any> = {
      soilType,
      ...(drainage ? { drainage } : {}),
      ...(observation ? { observation } : {}),
    };

    if (showLabCard) {
      if (ph.trim() !== "") payload.ph = ph.trim();
      if (organicCarbon.trim() !== "")
        payload.organicCarbon = organicCarbon.trim();
      if (nitrogen.trim() !== "") payload.nitrogen = nitrogen.trim();
      if (phosphorus.trim() !== "") payload.phosphorus = phosphorus.trim();
      if (potassium.trim() !== "") payload.potassium = potassium.trim();
      if (micronutrientNotes.trim() !== "") {
        payload.micronutrientNotes = micronutrientNotes.trim();
      }
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/soil/advisory", payload);
      if (res.data?.success && res.data?.data) {
        setAdvisory(res.data.data);
      } else {
        setErrorMsg(res.data?.message || "Unable to generate soil advisory.");
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Failed to fetch soil advisory.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoToFertilizerCalc = () => {
    const soilTest = advisory?.fertilizerHandoff?.soilTest;
    router.push({
      pathname: "/fertilizer-calculator" as any,
      params: {
        ...(soilTest?.n !== undefined ? { soilN: String(soilTest.n) } : {}),
        ...(soilTest?.p !== undefined ? { soilP: String(soilTest.p) } : {}),
        ...(soilTest?.k !== undefined ? { soilK: String(soilTest.k) } : {}),
      },
    });
  };

  const getStatusBadge = (status: "LOW" | "MEDIUM" | "HIGH") => {
    if (status === "HIGH") {
      return {
        bg: "bg-sky-50 border-sky-200",
        text: "text-sky-800",
      };
    }
    if (status === "MEDIUM") {
      return {
        bg: "bg-emerald-50 border-emerald-200",
        text: "text-emerald-800",
      };
    }
    return {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
    };
  };

  const getPriorityStyle = (priority: PriorityLevel) => {
    if (priority === "HIGH") {
      return {
        card: "bg-amber-50/60 border-amber-200/90",
        badge: "bg-amber-100 text-amber-900",
        label: "Priority",
      };
    }
    if (priority === "MEDIUM") {
      return {
        card: "bg-white border-slate-200/80",
        badge: "bg-emerald-50 text-emerald-800",
        label: "Recommended",
      };
    }
    return {
      card: "bg-white border-slate-200/80",
      badge: "bg-slate-100 text-slate-700",
      label: "Maintenance",
    };
  };

  const renderNutrientPill = (label: string, item: NutrientStatus | null) => {
    if (!item) return null;
    const badge = getStatusBadge(item.status);
    return (
      <View className="flex-1 bg-slate-50 border border-slate-200/70 p-3 rounded-xl gap-1.5">
        <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          {label}
        </Text>
        <Text className="text-base font-extrabold text-slate-900">
          {item.value}
        </Text>
        <View
          className={`self-start px-2 py-0.5 rounded-full border ${badge.bg}`}
        >
          <Text className={`text-[10px] font-extrabold ${badge.text}`}>
            {item.status}
          </Text>
        </View>
      </View>
    );
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
            Soil Advisory
          </Text>
          <Text className="text-xs text-slate-500">
            pH balance, organic carbon & field care guidance
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Card */}
        <View className="bg-white p-4 rounded-2xl border border-slate-200/80 gap-4">
          {/* Soil Type */}
          <View>
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Soil Type
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {SOIL_TYPES.map((type) => {
                  const active = soilType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSoilType(type)}
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
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Field Drainage */}
          <View>
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Field Drainage (Optional)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DRAINAGE_OPTIONS.map((opt) => {
                const active = drainage === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setDrainage(opt.value)}
                    activeOpacity={0.8}
                    className={`px-3 py-1.5 rounded-xl border ${
                      active
                        ? "bg-slate-900 border-slate-900"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Visual Observation */}
          <View>
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Field Observation (Optional)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {OBSERVATION_OPTIONS.map((opt) => {
                const active = observation === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setObservation(opt.value)}
                    activeOpacity={0.8}
                    className={`px-3 py-1.5 rounded-xl border ${
                      active
                        ? "bg-slate-900 border-slate-900"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Toggle Soil Health Card Inputs */}
          <TouchableOpacity
            onPress={() => setShowLabCard((prev) => !prev)}
            activeOpacity={0.75}
            className="flex-row items-center justify-between pt-2 border-t border-slate-100"
          >
            <View className="flex-row items-center gap-2">
              <FlaskConical size={15} color="#047857" />
              <Text className="text-xs font-bold text-emerald-800">
                {showLabCard
                  ? "Hide Soil Health Card / Lab Values"
                  : "Have a Soil Health Card? Add pH, OC & NPK"}
              </Text>
            </View>
          </TouchableOpacity>

          {showLabCard && (
            <View className="gap-3 pt-1">
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                    Soil pH (3.5–10.5)
                  </Text>
                  <TextInput
                    value={ph}
                    onChangeText={setPh}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 6.8"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                    Organic Carbon (%)
                  </Text>
                  <TextInput
                    value={organicCarbon}
                    onChangeText={setOrganicCarbon}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 0.6"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </View>
              </View>

              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                    N (kg/ha)
                  </Text>
                  <TextInput
                    value={nitrogen}
                    onChangeText={setNitrogen}
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                    P (kg/ha)
                  </Text>
                  <TextInput
                    value={phosphorus}
                    onChangeText={setPhosphorus}
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                    K (kg/ha)
                  </Text>
                  <TextInput
                    value={potassium}
                    onChangeText={setPotassium}
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </View>
              </View>

              <View>
                <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                  Micronutrient / Lab Notes (Optional)
                </Text>
                <TextInput
                  value={micronutrientNotes}
                  onChangeText={setMicronutrientNotes}
                  placeholder="e.g. Low Zinc noted on lab slip"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                />
              </View>
            </View>
          )}

          {errorMsg && (
            <View className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex-row items-center gap-2">
              <AlertCircle size={16} color="#e11d48" />
              <Text className="text-xs font-semibold text-rose-800 flex-1">
                {errorMsg}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleAnalyzeSoil}
            disabled={loading}
            activeOpacity={0.85}
            className="bg-emerald-700 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Sparkles size={17} color="#ffffff" />
                <Text className="text-white font-extrabold text-sm">
                  Get Soil Advisory
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {advisory && (
          <View className="gap-4">
            {/* pH Summary Card */}
            <View className="bg-white p-4 rounded-2xl border border-slate-200/80 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {advisory.soilType} Soil · pH Check
                </Text>
                <View className="bg-slate-100 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-extrabold text-slate-700">
                    {advisory.ph.value !== null
                      ? `pH ${advisory.ph.value} · ${advisory.ph.status.replace(/_/g, " ")}`
                      : advisory.ph.status.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-slate-700 leading-relaxed">
                {advisory.ph.summary}
              </Text>
            </View>

            {/* Nutrient Status Row (if OC or NPK provided) */}
            {(advisory.organicCarbon ||
              advisory.nutrients.nitrogen ||
              advisory.nutrients.phosphorus ||
              advisory.nutrients.potassium) && (
              <View className="bg-white p-4 rounded-2xl border border-slate-200/80 gap-2.5">
                <Text className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Measured Fertility Status
                </Text>
                <View className="flex-row gap-2">
                  {renderNutrientPill("Org. Carbon %", advisory.organicCarbon)}
                  {renderNutrientPill("Nitrogen", advisory.nutrients.nitrogen)}
                  {renderNutrientPill(
                    "Phosphorus",
                    advisory.nutrients.phosphorus,
                  )}
                  {renderNutrientPill(
                    "Potassium",
                    advisory.nutrients.potassium,
                  )}
                </View>
              </View>
            )}

            {/* Flagged Deficiencies */}
            {advisory.deficiencies.length > 0 && (
              <View className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl flex-row items-start gap-2.5">
                <ShieldAlert
                  size={17}
                  color="#b45309"
                  style={{ marginTop: 1 }}
                />
                <View className="flex-1">
                  <Text className="text-xs font-extrabold text-amber-950">
                    Flagged Soil Flags
                  </Text>
                  <Text className="text-xs text-amber-900 mt-0.5">
                    {advisory.deficiencies.join(" · ")}
                  </Text>
                </View>
              </View>
            )}

            {/* Recommendations */}
            <View className="gap-2.5">
              <View className="flex-row items-center gap-2">
                <Layers size={16} color="#047857" />
                <Text className="text-sm font-extrabold text-slate-900">
                  Actionable Soil Guidance
                </Text>
              </View>

              {advisory.recommendations.map((rec, idx) => {
                const pStyle = getPriorityStyle(rec.priority);
                return (
                  <View
                    key={`${rec.title}-${idx}`}
                    className={`p-4 rounded-2xl border gap-1.5 ${pStyle.card}`}
                  >
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="text-sm font-bold text-slate-900 flex-1">
                        {rec.title}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded-full ${pStyle.badge}`}
                      >
                        <Text className="text-[10px] font-extrabold uppercase">
                          {pStyle.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-700 leading-relaxed">
                      {rec.action}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Optional Hand-off to Fertilizer Calculator */}
            {advisory.fertilizerHandoff?.soilTest && (
              <TouchableOpacity
                onPress={handleGoToFertilizerCalc}
                activeOpacity={0.85}
                className="bg-slate-900 p-4 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                    Next Step
                  </Text>
                  <Text className="text-sm font-bold text-white mt-0.5">
                    Calculate Crop Fertilizer with Lab NPK
                  </Text>
                </View>
                <ArrowRight size={18} color="#ffffff" />
              </TouchableOpacity>
            )}

            <View className="flex-row items-center gap-2 px-1">
              <CheckCircle2 size={14} color="#047857" />
              <Text className="text-[11px] text-slate-500 flex-1">
                Confirm heavy lime or gypsum rates with your local Soil Health
                Card / KVK agronomist before field application.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
