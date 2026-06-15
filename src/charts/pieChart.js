import { renderChart } from "./chartManager.js";

export function renderPieChart(id, labels, values) {
  renderChart(id, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Category share",
        data: values,
        backgroundColor: ["#2d9caa", "#4f8f6f", "#d78b23", "#7566b1", "#c95c60"],
        borderWidth: 0
      }]
    },
    options: { cutout: "62%" }
  });
}
