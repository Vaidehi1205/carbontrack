export const factors = {
  transportation: {
    car_petrol: { label: "Petrol car", unit: "km", factor: 0.192, icon: "🚗", difficulty: 2 },
    car_electric: { label: "Electric car", unit: "km", factor: 0.053, icon: "⚡", difficulty: 2 },
    bus: { label: "Bus", unit: "km", factor: 0.089, icon: "🚌", difficulty: 1 },
    train: { label: "Train", unit: "km", factor: 0.041, icon: "🚆", difficulty: 1 },
    bike_walk: { label: "Bike or walk", unit: "km", factor: 0, icon: "↗", difficulty: 1 }
  },
  energy: {
    electricity: { label: "Electricity", unit: "kWh", factor: 0.386, icon: "💡", difficulty: 2 },
    natural_gas: { label: "Natural gas", unit: "therms", factor: 5.3, icon: "🔥", difficulty: 2 },
    renewable_credit: { label: "Renewable credit", unit: "kWh", factor: -0.22, icon: "✓", difficulty: 2 }
  },
  food: {
    chicken_meal: { label: "Chicken meal", unit: "serving", factor: 1.8, icon: "🍽", difficulty: 1 },
    dairy: { label: "Dairy serving", unit: "serving", factor: 1.4, icon: "🥛", difficulty: 1 },
    plant_meal: { label: "Plant-based meal", unit: "serving", factor: 0.7, icon: "🥗", difficulty: 1 }
  },
  shopping: {
    clothing: { label: "Clothing purchase", unit: "item", factor: 18, icon: "👕", difficulty: 1 },
    electronics: { label: "Electronics purchase", unit: "item", factor: 90, icon: "▣", difficulty: 3 },
    household_goods: { label: "Household goods", unit: "$100", factor: 24, icon: "□", difficulty: 2 }
  },
  waste: {
    landfill: { label: "Landfill waste", unit: "bag", factor: 3.2, icon: "▥", difficulty: 1 },
    recycled: { label: "Recycled waste", unit: "bag", factor: 0.7, icon: "♻", difficulty: 1 },
    composted: { label: "Composted waste", unit: "bag", factor: 0.25, icon: "◌", difficulty: 1 }
  }
};

export const countryBenchmarks = {
  IN: { label: "India", annualKg: 1900 },
  US: { label: "USA", annualKg: 14670 },
  UK: { label: "UK", annualKg: 5200 },
  CA: { label: "Canada", annualKg: 14600 },
  AU: { label: "Australia", annualKg: 15000 }
};
