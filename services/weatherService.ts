import axios from "axios";
import * as Location from "expo-location";

function getWeatherCondition(code: number): string {
  if (code === 0) return "Clear Sky";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rainy";
  if ([71, 73, 75, 77].includes(code)) return "Snowy";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Fair";
}

export async function fetchLocalWeatherAndLocation() {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permission to access location was denied");
    }

    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = location.coords;

    let reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    let village = "Local Farm";
    let block = "Main Block";
    let district = "Agri District";

    if (reverseGeocode.length > 0) {
      const p = reverseGeocode[0];
      village = p.name || p.subregion || p.city || "Local Farm";
      block = p.subregion || p.district || "Main Block";
      district = p.region || p.district || "Agri District";
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
    const response = await axios.get(weatherUrl);
    const current = response.data.current;

    return {
      village,
      block,
      district,
      locationName: `${village}, ${district}`,
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      condition: getWeatherCondition(current.weather_code),
      latitude,
      longitude,
    };
  } catch (error) {
    console.error("Error fetching weather & location:", error);
    return {
      village: "Pipariya",
      block: "Sehore",
      district: "Sehore",
      locationName: "Pipariya, Sehore",
      temperature: 28,
      humidity: 65,
      windSpeed: 12,
      condition: "Clear Sky",
      latitude: 23.2015,
      longitude: 77.0846,
    };
  }
}
