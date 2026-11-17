import { CloudSun, Droplets, MapPin, Wind } from "lucide-react-native";
import { Text, View } from "react-native";

interface WeatherStripProps {
  locationName: string;
  temperature: number | string;
  humidity: number | string;
  windSpeed: number | string;
  condition: string;
}

export default function WeatherStrip({
  locationName,
  temperature,
  humidity,
  windSpeed,
  condition,
}: WeatherStripProps) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
      <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <View className="flex-row items-center gap-1.5">
          <MapPin size={14} color="#059669" />
          <Text className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
            {locationName}
          </Text>
        </View>
        <Text className="text-[10px] text-slate-400">Pull down to refresh</Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 bg-emerald-50 rounded-xl items-center justify-center border border-emerald-100">
            <CloudSun size={26} color="#059669" />
          </View>
          <View>
            <Text className="text-slate-900 font-extrabold text-lg">
              {temperature}°C · {condition}
            </Text>
            <Text className="text-slate-500 text-xs">
              Live local weather metrics
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4">
          <View className="items-center">
            <View className="flex-row items-center gap-1">
              <Droplets size={13} color="#059669" />
              <Text className="text-slate-800 font-bold text-xs">
                {humidity}%
              </Text>
            </View>
            <Text className="text-slate-400 text-[10px]">Humidity</Text>
          </View>
          <View className="items-center">
            <View className="flex-row items-center gap-1">
              <Wind size={13} color="#059669" />
              <Text className="text-slate-800 font-bold text-xs">
                {windSpeed} km/h
              </Text>
            </View>
            <Text className="text-slate-400 text-[10px]">Wind</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
