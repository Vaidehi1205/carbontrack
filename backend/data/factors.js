/**
 * Emission factors mirrored from the frontend for server-side CO2 calculations.
 * Values are kg CO2e per unit.
 */
export const factors = {
  transportation: {
    car_petrol: { factor: 0.192, unit: "km", label: "Petrol car" },
    car_diesel: { factor: 0.171, unit: "km", label: "Diesel car" },
    car_electric: { factor: 0.053, unit: "km", label: "Electric car" },
    bus: { factor: 0.089, unit: "km", label: "Bus" },
    train: { factor: 0.041, unit: "km", label: "Train" },
    flight_short: { factor: 0.255, unit: "km", label: "Short flight" },
    flight_long: { factor: 0.195, unit: "km", label: "Long flight" },
    bike_walk: { factor: 0, unit: "km", label: "Bike / walk" }
  },
  energy: {
    electricity: { factor: 0.475, unit: "kWh", label: "Electricity" },
    natural_gas: { factor: 2.02, unit: "m3", label: "Natural gas" },
    heating_oil: { factor: 2.52, unit: "L", label: "Heating oil" }
  },
  food: {
    beef_meal: { factor: 27, unit: "meal", label: "Beef meal" },
    chicken_meal: { factor: 6.9, unit: "meal", label: "Chicken meal" },
    plant_meal: { factor: 1.5, unit: "meal", label: "Plant-based meal" },
    dairy: { factor: 3.2, unit: "serving", label: "Dairy serving" }
  },
  shopping: {
    clothing: { factor: 25, unit: "item", label: "Clothing item" },
    electronics: { factor: 300, unit: "item", label: "Electronics" },
    furniture: { factor: 90, unit: "item", label: "Furniture" }
  },
  waste: {
    landfill: { factor: 0.5, unit: "kg", label: "Landfill waste" },
    recycled: { factor: 0.02, unit: "kg", label: "Recycled material" },
    composted: { factor: 0.01, unit: "kg", label: "Composted material" }
  }
};

/**
 * Calculate carbon emission for an activity.
 */
export function calculateEmission(category, activityType, value) {
  const factorData = factors[category]?.[activityType];
  if (!factorData) {
    throw new Error(`Unknown activity type: ${category}/${activityType}`);
  }
  return Math.round(Number(value) * factorData.factor * 100) / 100;
}
