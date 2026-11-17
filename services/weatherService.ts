import axios from "axios";
import * as Location from "expo-location";

// Helper to translate Open-Meteo WMO weather codes into readable labels
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
    // 1. Request foreground GPS permissions
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permission to access location was denied");
    }

    // 2. Get current position coordinates
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = location.coords;

    // 3. Reverse geocode to get human-readable location name (Village / City / District)
    let reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    let placeName = "Local Farm";
    if (reverseGeocode.length > 0) {
      const p = reverseGeocode[0];
      placeName = p.district || p.city || p.district || "My Farm";
    }

    // 4. Fetch live weather from Open-Meteo (100% Free, No API Key)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
    const response = await axios.get(weatherUrl);
    const current = response.data.current;

    return {
      locationName: placeName,
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      condition: getWeatherCondition(current.weather_code),
      latitude,
      longitude,
    };
  } catch (error) {
    console.error("Error fetching weather & location:", error);
    // Fallback default values if GPS fails (e.g. inside a desktop emulator without mock GPS)
    return {
      locationName: "Agri Zone",
      temperature: 28,
      humidity: 65,
      windSpeed: 12,
      condition: "Clear Sky",
      latitude: 20.2961,
      longitude: 85.8245,
    };
  }
}
