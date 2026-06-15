import { renderChart } from "./chartManager.js";

export function renderBarChart(id, labels, values, label = "kg CO2e") {
  renderChart(id, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: ["#d78b23", "#4f8f6f", "#7566b1", "#2d9caa", "#c95c60"],
        borderRadius: 8
      }]
    }
  });
}
