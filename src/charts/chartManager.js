let instances = {};

export function destroyChart(id) {
  if (instances[id]) {
    instances[id].destroy();
    delete instances[id];
  }
}

export function chartTheme() {
  const dark = document.documentElement.dataset.theme === "dark";
  return {
    grid: dark ? "rgba(255,255,255,.12)" : "rgba(38,54,47,.12)",
    text: dark ? "#d9e6df" : "#41504a"
  };
}

export function renderChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return;
  destroyChart(id);
  const theme = chartTheme();
  instances[id] = new Chart(canvas, {
    ...config,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 750, easing: "easeOutQuart" },
      plugins: {
        legend: { display: true, labels: { color: theme.text, usePointStyle: true } },
        tooltip: { enabled: true, backgroundColor: "rgba(21,32,28,.92)", padding: 12, cornerRadius: 8 },
        ...(config.options?.plugins || {})
      },
      scales: config.type === "doughnut" ? undefined : {
        x: { grid: { color: theme.grid }, ticks: { color: theme.text } },
        y: { grid: { color: theme.grid }, ticks: { color: theme.text }, beginAtZero: true }
      },
      ...(config.options || {})
    }
  });
}
