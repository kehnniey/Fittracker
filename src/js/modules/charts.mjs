/**
 * CHARTS MODULE
 * Handles all Chart.js visualizations
 */

import { loadWorkouts, loadMeals } from './storage.mjs';

// Chart instances
let workoutChart = null;
let calorieChart = null;

/** Initialize all charts */
export function initCharts() {
    createWorkoutChart();
    createCalorieChart();
}

/** Update all charts */
export function updateCharts() {
    updateWorkoutChart();
    updateCalorieChart();
}

/* ============================================================
   WORKOUT CHART (Bar Chart)
============================================================ */

function createWorkoutChart() {
    const canvas = document.getElementById('workoutChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (workoutChart) workoutChart.destroy();

    workoutChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Workouts',
                data: [],
                backgroundColor: 'rgba(42,157,143,0.8)',
                borderColor: 'rgba(42,157,143,1)',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#666' }},
                x: { ticks: { color: '#666' }}
            }
        }
    });

    updateWorkoutChart();
}

function updateWorkoutChart() {
    if (!workoutChart) return;

    const workouts = loadWorkouts();

    const days = [];
    const counts = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        days.push(
            i === 0 ? 'Today' :
            i === 1 ? 'Yesterday' :
            date.toLocaleDateString('en-US', { weekday: 'short' })
        );

        counts.push(workouts.filter(w => w.date === dateStr).length);
    }

    workoutChart.data.labels = days;
    workoutChart.data.datasets[0].data = counts;
    workoutChart.update();
}

/* ============================================================
   CALORIE CHART (Line Chart)
============================================================ */

function createCalorieChart() {
    const canvas = document.getElementById('calorieChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (calorieChart) calorieChart.destroy();

    calorieChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Calories Consumed',
                    data: [],
                    borderColor: '#E9C46A',
                    backgroundColor: 'rgba(233,196,106,0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Goal',
                    data: [],
                    borderColor: '#264653',
                    borderDash: [5,5],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });

    updateCalorieChart();
}

function updateCalorieChart() {
    if (!calorieChart) return;

    const meals = loadMeals();
    const goal = 2000;

    const days = [];
    const calories = [];
    const goals = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        days.push(
            i === 0 ? 'Today' :
            i === 1 ? 'Yesterday' :
            date.toLocaleDateString('en-US', { weekday: 'short' })
        );

        const dayMeals = meals.filter(m => m.date === dateStr);
        calories.push(dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0));
        goals.push(goal);
    }

    calorieChart.data.labels = days;
    calorieChart.data.datasets[0].data = calories;
    calorieChart.data.datasets[1].data = goals;
    calorieChart.update();
}

/** Cleanup */
export function destroyCharts() {
    if (workoutChart) {
        workoutChart.destroy();
        workoutChart = null;
    }
    if (calorieChart) {
        calorieChart.destroy();
        calorieChart = null;
    }
}

/* ============================================================
   TEST PROGRESS CHART (Does NOT break dashboard)
============================================================ */

function loadTestProgressChart() {
    const placeholder = document.getElementById("chartPlaceholder");
    const canvas = document.getElementById("progressChart");

    // Only run if this special test section exists
    if (!canvas || !placeholder) return;

    canvas.style.display = "block";
    placeholder.style.display = "none";

    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
            datasets: [{
                label: "Workout Minutes",
                data: [40, 55, 50, 70, 90],
                borderWidth: 3,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            },
            scales: { y: { beginAtZero: true }}
        }
    });
}

// Run test chart ONLY if available
document.addEventListener("DOMContentLoaded", loadTestProgressChart);
