/**
 * Build lightweight personalized recommendations from emission context.
 * @param {object} context Dashboard emission context.
 * @returns {Array<object>}
 */
export function getRecommendations(context) {
  const topCategory = Object.entries(context.breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "transportation";
  const recommendations = {
    transportation: "Swap one short car trip for transit, cycling, or walking this week.",
    energy: "Shift high-energy appliance use away from peak hours and trim standby power.",
    food: "Replace one high-carbon meal with a plant-forward option.",
    shopping: "Delay non-essential purchases and choose repair or second-hand first.",
    waste: "Move recyclable and compostable material out of landfill waste."
  };

  return [
    {
      category: topCategory,
      title: `Reduce ${topCategory} emissions`,
      action: recommendations[topCategory] || recommendations.transportation,
      score: 0.92
    },
    {
      category: "tracking",
      title: "Keep your data fresh",
      action: "Log activities daily so CarbonTrack can detect trends sooner.",
      score: 0.84
    }
  ];
}
