export const recommendationActions = [
  {
    id: "transit",
    category: "transportation",
    title: "Switch 2 car commutes to transit",
    text: "Your driving entries make this one of the highest leverage changes.",
    impact: 410,
    savings: 1840,
    effort: "Easy",
    difficulty: 1,
    triggerTypes: ["car_petrol"]
  },
  {
    id: "meatless",
    category: "food",
    title: "Try two plant-based dinners weekly",
    text: "Replacing beef meals has a fast weekly impact without changing every meal.",
    impact: 320,
    savings: 460,
    effort: "Easy",
    difficulty: 1,
    triggerTypes: ["beef_meal", "chicken_meal"]
  },
  {
    id: "renewable",
    category: "energy",
    title: "Move part of your electricity to renewables",
    text: "A 50% renewable plan can reduce energy emissions while keeping routines intact.",
    impact: 620,
    savings: 120,
    effort: "Medium",
    difficulty: 2,
    triggerTypes: ["electricity", "natural_gas"]
  },
  {
    id: "reuse",
    category: "shopping",
    title: "Buy secondhand for your next clothing item",
    text: "Shopping emissions are spiky. This keeps the next spike lower.",
    impact: 140,
    savings: 260,
    effort: "Easy",
    difficulty: 1,
    triggerTypes: ["clothing", "household_goods"]
  },
  {
    id: "compost",
    category: "waste",
    title: "Compost food scraps twice a week",
    text: "Waste is a smaller category, but composting builds a reliable habit loop.",
    impact: 80,
    savings: 30,
    effort: "Medium",
    difficulty: 2,
    triggerTypes: ["landfill"]
  },
  {
    id: "offsets",
    category: "energy",
    title: "Offset your unavoidable monthly footprint",
    text: "Use verified tree planting, solar, or renewable electricity programs for emissions you cannot avoid yet.",
    impact: 500,
    savings: 0,
    effort: "Easy",
    difficulty: 1,
    triggerTypes: []
  }
];
