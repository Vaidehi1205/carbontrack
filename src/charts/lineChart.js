import { renderChart } from "./chartManager.js";

export function renderLineChart(id, labels, values, label = "kg CO2e") {
  renderChart(id, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: "#2d9caa",
        backgroundColor: "rgba(45,156,170,.16)",
        tension: 0.36,
        fill: true,
        pointRadius: 3
      }]
    }
  });
}
