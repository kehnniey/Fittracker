/**
 * charts.mjs
 * Chart.js visualizations
 */

import { loadWorkouts, loadMeals } from './storage.mjs';

let workoutChart = null;
let calorieChart = null;

export function initCharts() {
    createWorkoutChart();
    createCalorieChart();
}

export function updateCharts() {
    updateWorkoutChart();
    updateCalorieChart();
}

function createWorkoutChart() {
    const canvas = document.getElementById('workoutChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (workoutChart) workoutChart.destroy();

    workoutChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Workouts', data: [], backgroundColor: 'rgba(42,157,143,0.8)', borderColor: 'rgba(42,157,143,1)', borderWidth:2, borderRadius:6 }]},
        options: { responsive: true, maintainAspectRatio: true, plugins:{ legend:{display:false}}, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1, color:'#666'}}, x:{ ticks:{ color:'#666'}}}}
    });

    updateWorkoutChart();
}

function updateWorkoutChart() {
    if (!workoutChart) return;
    const workouts = loadWorkouts();
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const s = d.toISOString().split('T')[0];
        labels.push(i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', {weekday:'short'}));
        data.push(workouts.filter(w => w.date === s).length);
    }
    workoutChart.data.labels = labels;
    workoutChart.data.datasets[0].data = data;
    workoutChart.update();
}

function createCalorieChart() {
    const canvas = document.getElementById('calorieChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (calorieChart) calorieChart.destroy();

    calorieChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Calories Consumed', data: [], borderColor: '#E9C46A', backgroundColor: 'rgba(233,196,106,0.1)', borderWidth:3, tension:0.4, fill:true },
            { label: 'Goal', data: [], borderColor: '#264653', borderDash:[5,5], fill:false }
        ]},
        options: { responsive:true, maintainAspectRatio:true }
    });

    updateCalorieChart();
}

function updateCalorieChart() {
    if (!calorieChart) return;
    const meals = loadMeals();
    const goal = 2000;
    const labels = [], calories = [], goals = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const s = d.toISOString().split('T')[0];
        labels.push(i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', {weekday:'short'}));
        const dayMeals = meals.filter(m => m.date === s);
        calories.push(dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0));
        goals.push(goal);
    }
    calorieChart.data.labels = labels;
    calorieChart.data.datasets[0].data = calories;
    calorieChart.data.datasets[1].data = goals;
    calorieChart.update();
}

export function destroyCharts() {
    if (workoutChart) { workoutChart.destroy(); workoutChart = null; }
    if (calorieChart) { calorieChart.destroy(); calorieChart = null; }
}

/* ------------- Test progress chart (non-invasive) ------------- */
export function loadTestProgressChart() {
    const placeholder = document.getElementById('chartPlaceholder');
    const chartCanvas = document.getElementById('progressChart');
    if (!chartCanvas) return; // nothing to do

    // If there is no placeholder, still show chart but non-destructively
    if (placeholder) placeholder.style.display = 'none';
    chartCanvas.style.display = 'block';

    const ctx = chartCanvas.getContext('2d');
    // Keep separate instance so it doesn't conflict with other charts
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1','Week 2','Week 3','Week 4','Week 5'],
            datasets: [{ label: 'Workout Minutes', data: [40,55,50,70,90], borderWidth:3, tension:0.4 }]
        },
        options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true }}}
    });
}
