/**
 * dashboard.mjs
 */
import {
    getTodaysMeals,
    getTodaysWorkouts,
    getRecentWorkouts,
    calculateStreak,
    getCaloriesForDate,
    loadSettings
} from './storage.mjs';

export function updateDashboard() {
    updateNutritionCard();
    updateWorkoutCard();
    updateStatsCards();
}

function updateNutritionCard() {
    const today = new Date().toISOString().split('T')[0];
    const totalCalories = getCaloriesForDate(today);
    const settings = loadSettings();
    const goal = settings.calorieGoal || 2000;

    const caloriesEatenElement = document.getElementById('caloriesEaten');
    const calorieGoalElement = document.getElementById('calorieGoal');

    if (caloriesEatenElement) caloriesEatenElement.textContent = totalCalories;
    if (calorieGoalElement) calorieGoalElement.textContent = goal;

    updateProgressBar(totalCalories, goal);
}

function updateProgressBar(current, goal) {
    const progressBar = document.getElementById('calorieProgress');
    if (!progressBar) return;
    const percentage = Math.min((current / (goal || 1)) * 100, 100);
    progressBar.style.width = percentage + '%';
    if (percentage >= 100) {
        progressBar.style.background = 'linear-gradient(90deg, #F4A261 0%, #E76F51 100%)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #2A9D8F 0%, #E9C46A 100%)';
    }
}

function updateWorkoutCard() {
    const workoutDisplay = document.getElementById('todayWorkout');
    if (!workoutDisplay) return;
    const todaysWorkouts = getTodaysWorkouts();
    if (!todaysWorkouts || todaysWorkouts.length === 0) {
        workoutDisplay.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💪</div>
                <p>No workout scheduled for today</p>
            </div>
        `;
    } else {
        const lastWorkout = todaysWorkouts[todaysWorkouts.length - 1];
        workoutDisplay.innerHTML = `
            <div class="workout-title">${lastWorkout.name}</div>
            <div class="workout-details">
                ${lastWorkout.duration || 0} min • ${lastWorkout.sets || 0} sets × ${lastWorkout.reps || 0} reps
            </div>
        `;
    }
}

function updateStatsCards() {
    updateWeeklyWorkouts();
    updateStreak();
}

function updateWeeklyWorkouts() {
    const weekWorkoutsElement = document.getElementById('weekWorkouts');
    if (!weekWorkoutsElement) return;
    const recentWorkouts = getRecentWorkouts(7);
    weekWorkoutsElement.textContent = recentWorkouts.length;
    weekWorkoutsElement.classList.add('stat-update');
    setTimeout(() => weekWorkoutsElement.classList.remove('stat-update'), 300);
}

function updateStreak() {
    const streakElement = document.getElementById('currentStreak');
    if (!streakElement) return;
    const streak = calculateStreak();
    streakElement.textContent = streak;
    streakElement.classList.add('stat-update');
    setTimeout(() => streakElement.classList.remove('stat-update'), 300);
}

export function displayTodaysMeals() {
    const mealListElement = document.getElementById('mealList');
    const mealsSection = document.getElementById('meals');
    if (!mealListElement || !mealsSection) return;
    const todaysMeals = getTodaysMeals();
    if (!todaysMeals || todaysMeals.length === 0) {
        mealListElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🍽️</div>
                <p>No meals logged today</p>
            </div>
        `;
    } else {
        const mealsByType = groupMealsByType(todaysMeals);
        mealListElement.innerHTML = Object.entries(mealsByType)
            .map(([type, meals]) => `
                <div style="margin-bottom:1.5rem;">
                    <h3 style="color:#2A9D8F; text-transform:capitalize; margin-bottom:.75rem;">${type}</h3>
                    ${meals.map(meal => `
                        <div class="meal-entry">
                            <div><div class="meal-name">${meal.name}</div></div>
                            <div class="meal-calories">${meal.calories} cal</div>
                        </div>
                    `).join('')}
                </div>
            `).join('');
    }
    mealsSection.style.display = 'block';
    mealsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function groupMealsByType(meals) {
    const grouped = {};
    (meals || []).forEach(meal => {
        const t = meal.type || 'other';
        grouped[t] = grouped[t] || [];
        grouped[t].push(meal);
    });
    return grouped;
}

export function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(()=>toast.remove(), 300); }, 3000);
}

export function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(()=>toast.remove(), 300); }, 3000);
}

// Expose to window so other modules (older code) can call these safely
if (typeof window !== 'undefined') {
    window.showSuccessMessage = showSuccessMessage;
    window.showErrorMessage = showErrorMessage;
}

/* small utilities */
export function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000*60*60*24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined});
}

export function displayWeeklySummary() {
    const workouts = getRecentWorkouts(7);
    const totalDuration = workouts.reduce((s,w)=>s + (w.duration || 0), 0);
    const uniqueDays = new Set(workouts.map(w=>w.date)).size;
    console.log('Weekly Summary:', { totalWorkouts: workouts.length, totalDuration, uniqueDays });
}
