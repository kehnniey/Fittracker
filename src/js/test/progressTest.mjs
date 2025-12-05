// src/js/test/progressTest.mjs

export function loadTestProgressChart() {
    const placeholder = document.getElementById("chartPlaceholder");
    const chartCanvas = document.getElementById("progressChart");

    if (!placeholder || !chartCanvas) return;

    chartCanvas.style.display = "block";
    placeholder.style.display = "none";

    const ctx = chartCanvas.getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
            datasets: [
                {
                    label: "Workout Minutes",
                    data: [40, 55, 50, 70, 90],
                    borderWidth: 3,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
