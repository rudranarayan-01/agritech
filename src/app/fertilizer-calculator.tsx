import { router, useLocalSearchParams } from "expo-router";
import {
    AlertCircle,
    ArrowLeft,
    Calculator,
    CheckCircle2,
    FlaskConical,
    Layers,
    Package,
} from "lucide-react-native";
import { useEffect, useState } from "react";
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

interface SupportedCrop {
  key: string;
  label: string;
  standardNpkPerHa: { n: number; p: number; k: number };
}

interface FertilizerItem {
  code: string;
  name: string;
  totalKg: number;
  bags50Kg: number;
  timing: string;
}

interface ScheduleStage {
  stage: string;
  timing: string;
  doses: Array<{ name: string; kg: number; bags: number }>;
}

interface CalculationResult {
  crop: string;
  plotArea: number;
  landUnit: string;
  areaInHectares: number;
  soilAdjusted: boolean;
  nutrientsRequiredKg: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  fertilizers: FertilizerItem[];
  applicationSchedule: ScheduleStage[];
  advisories: string[];
}

const LAND_UNITS = ["acre", "hectare", "bigha"] as const;

export default function FertilizerCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    cropName?: string;
    plotArea?: string;
    landUnit?: string;
    weatherCondition?: string;
  }>();

  const [crops, setCrops] = useState<SupportedCrop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);

  const [selectedCrop, setSelectedCrop] = useState<string>(
    params.cropName || "Wheat",
  );
  const [plotArea, setPlotArea] = useState<string>(params.plotArea || "2.5");
  const [landUnit, setLandUnit] = useState<string>(params.landUnit || "acre");

  const [showSoilInputs, setShowSoilInputs] = useState(false);
  const [soilN, setSoilN] = useState("");
  const [soilP, setSoilP] = useState("");
  const [soilK, setSoilK] = useState("");

  const [calculating, setCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoadingCrops(true);
        const res = await apiClient.get("/fertilizers/crops");
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCrops(res.data.data);
          if (!params.cropName && res.data.data.length > 0) {
            setSelectedCrop(res.data.data[0].label);
          }
        }
      } catch (err: any) {
        setErrorMsg("Unable to load supported crops.");
      } finally {
        setLoadingCrops(false);
      }
    };
    fetchCrops();
  }, []);

  const handleCalculate = async () => {
    setErrorMsg(null);
    const numericArea = parseFloat(plotArea);

    if (!selectedCrop.trim()) {
      setErrorMsg("Please select a crop.");
      return;
    }
    if (isNaN(numericArea) || numericArea <= 0) {
      setErrorMsg("Enter a valid plot area greater than 0.");
      return;
    }

    const payload: Record<string, any> = {
      cropName: selectedCrop,
      plotArea: numericArea,
      landUnit,
    };

    if (params.weatherCondition) {
      payload.weatherCondition = params.weatherCondition;
    }

    const nVal = parseFloat(soilN);
    const pVal = parseFloat(soilP);
    const kVal = parseFloat(soilK);
    if (!isNaN(nVal) || !isNaN(pVal) || !isNaN(kVal)) {
      payload.soilTest = {
        ...(!isNaN(nVal) ? { n: nVal } : {}),
        ...(!isNaN(pVal) ? { p: pVal } : {}),
        ...(!isNaN(kVal) ? { k: kVal } : {}),
      };
    }

    try {
      setCalculating(true);
      const res = await apiClient.post("/fertilizers/calculate", payload);
      if (res.data?.success) {
        setResult(res.data.data);
      } else {
        setErrorMsg(res.data?.message || "Calculation failed.");
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || "Failed to calculate fertilizer plan.",
      );
    } finally {
      setCalculating(false);
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white px-5 py-3.5 border-b border-slate-200/80 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
        >
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text className="text-base font-extrabold text-slate-900">
            Fertilizer Calculator
          </Text>
          <Text className="text-xs text-slate-500">
            NPK dosing, 50kg bag count & split schedule
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
          <View>
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Crop
            </Text>
            {loadingCrops ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {crops.map((item) => {
                    const active =
                      selectedCrop.toLowerCase() === item.label.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => setSelectedCrop(item.label)}
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
            )}
          </View>

          {/* Plot Area & Land Unit */}
          <View className="flex-row gap-3 items-end">
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Plot Area
              </Text>
              <TextInput
                value={plotArea}
                onChangeText={setPlotArea}
                keyboardType="decimal-pad"
                placeholder="e.g. 2.5"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
              />
            </View>

            <View className="flex-row bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              {LAND_UNITS.map((unit) => {
                const selected = landUnit === unit;
                return (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => setLandUnit(unit)}
                    className={`px-2.5 py-1.5 rounded-lg ${
                      selected ? "bg-white" : ""
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold capitalize ${
                        selected ? "text-emerald-800" : "text-slate-500"
                      }`}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Optional Soil Test Toggle */}
          <TouchableOpacity
            onPress={() => setShowSoilInputs((prev) => !prev)}
            className="flex-row items-center justify-between pt-1"
          >
            <View className="flex-row items-center gap-2">
              <FlaskConical size={15} color="#047857" />
              <Text className="text-xs font-bold text-emerald-800">
                {showSoilInputs
                  ? "Hide Soil Test Values (kg/ha)"
                  : "Optional: Add Soil Health Card (N-P-K)"}
              </Text>
            </View>
          </TouchableOpacity>

          {showSoilInputs && (
            <View className="flex-row gap-2.5 pt-1">
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                  Soil N
                </Text>
                <TextInput
                  value={soilN}
                  onChangeText={setSoilN}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                  Soil P
                </Text>
                <TextInput
                  value={soilP}
                  onChangeText={setSoilP}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-500 mb-1">
                  Soil K
                </Text>
                <TextInput
                  value={soilK}
                  onChangeText={setSoilK}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                />
              </View>
            </View>
          )}

          {errorMsg && (
            <View className="bg-red-50 border border-red-200 p-3 rounded-xl flex-row items-center gap-2">
              <AlertCircle size={16} color="#dc2626" />
              <Text className="text-xs font-semibold text-red-700 flex-1">
                {errorMsg}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleCalculate}
            disabled={calculating}
            activeOpacity={0.85}
            className="bg-emerald-700 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
          >
            {calculating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Calculator size={18} color="#ffffff" />
                <Text className="text-white font-extrabold text-sm">
                  Calculate Requirement
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {result && (
          <View className="gap-5">
            {/* Nutrient Summary Row */}
            <View className="bg-white p-4 rounded-2xl border border-slate-200/80 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-extrabold text-slate-900">
                  {result.crop} · {result.plotArea} {result.landUnit}
                </Text>
                <Text className="text-xs font-semibold text-slate-500">
                  {result.areaInHectares} ha
                </Text>
              </View>

              <View className="flex-row gap-2.5">
                <View className="flex-1 bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-xl">
                  <Text className="text-[11px] font-bold text-emerald-800">
                    NITROGEN (N)
                  </Text>
                  <Text className="text-base font-extrabold text-slate-900 mt-0.5">
                    {result.nutrientsRequiredKg.nitrogen} kg
                  </Text>
                </View>
                <View className="flex-1 bg-sky-50/70 border border-sky-200/60 p-3 rounded-xl">
                  <Text className="text-[11px] font-bold text-sky-800">
                    PHOSPHORUS (P)
                  </Text>
                  <Text className="text-base font-extrabold text-slate-900 mt-0.5">
                    {result.nutrientsRequiredKg.phosphorus} kg
                  </Text>
                </View>
                <View className="flex-1 bg-amber-50/70 border border-amber-200/60 p-3 rounded-xl">
                  <Text className="text-[11px] font-bold text-amber-800">
                    POTASSIUM (K)
                  </Text>
                  <Text className="text-base font-extrabold text-slate-900 mt-0.5">
                    {result.nutrientsRequiredKg.potassium} kg
                  </Text>
                </View>
              </View>
            </View>

            {/* Commercial Fertilizers (50kg Bags) */}
            <View className="gap-2.5">
              <View className="flex-row items-center gap-2">
                <Package size={16} color="#047857" />
                <Text className="text-sm font-extrabold text-slate-900">
                  Fertilizer Quantities (50 kg Bags)
                </Text>
              </View>

              {result.fertilizers.map((fert) => (
                <View
                  key={fert.code}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 flex-row items-center justify-between"
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-bold text-slate-900">
                      {fert.name}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {fert.timing}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-extrabold text-emerald-800">
                      {fert.bags50Kg} Bags
                    </Text>
                    <Text className="text-[11px] font-semibold text-slate-500">
                      {fert.totalKg} kg total
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Application Schedule */}
            <View className="gap-2.5">
              <View className="flex-row items-center gap-2">
                <Layers size={16} color="#047857" />
                <Text className="text-sm font-extrabold text-slate-900">
                  Split Application Schedule
                </Text>
              </View>

              {result.applicationSchedule.map((item, index) => (
                <View
                  key={`${item.stage}-${index}`}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 gap-2"
                >
                  <Text className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                    Stage {index + 1} · {item.timing}
                  </Text>
                  {item.doses.map((dose, idx) => (
                    <View
                      key={`${dose.name}-${idx}`}
                      className="flex-row items-center justify-between py-1 border-t border-slate-100"
                    >
                      <Text className="text-xs font-bold text-slate-800">
                        {dose.name}
                      </Text>
                      <Text className="text-xs font-semibold text-slate-600">
                        {dose.bags} bags ({dose.kg} kg)
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Advisories */}
            {result.advisories && result.advisories.length > 0 && (
              <View className="bg-emerald-50/70 border border-emerald-200/70 p-4 rounded-2xl gap-2">
                {result.advisories.map((note, i) => (
                  <View key={i} className="flex-row items-start gap-2">
                    <CheckCircle2
                      size={15}
                      color="#047857"
                      style={{ marginTop: 2 }}
                    />
                    <Text className="text-xs text-emerald-950 flex-1 leading-relaxed">
                      {note}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
