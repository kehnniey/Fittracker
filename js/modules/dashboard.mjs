/**
 * DASHBOARD MODULE
 * 
 * This module handles all dashboard-related functionality:
 * - Updating calorie displays
 * - Showing today's workout
 * - Displaying statistics (streak, weekly workouts)
 * - Refreshing the UI when data changes
 */

import { 
    getTodaysMeals, 
    getTodaysWorkouts, 
    getRecentWorkouts, 
    calculateStreak,
    getCaloriesForDate,
    loadSettings 
} from './storage.mjs';

/**
 * Update the entire dashboard with current data
 * This should be called whenever data changes
 */
export function updateDashboard() {
    updateNutritionCard();
    updateWorkoutCard();
    updateStatsCards();
}

/**
 * Update the nutrition card with today's calorie information
 */
function updateNutritionCard() {
    const today = new Date().toISOString().split('T')[0];
    const totalCalories = getCaloriesForDate(today);
    const settings = loadSettings();
    const goal = settings.calorieGoal || 2000;
    
    // Update calorie numbers
    const caloriesEatenElement = document.getElementById('caloriesEaten');
    const calorieGoalElement = document.getElementById('calorieGoal');
    
    if (caloriesEatenElement) {
        caloriesEatenElement.textContent = totalCalories;
    }
    
    if (calorieGoalElement) {
        calorieGoalElement.textContent = goal;
    }
    
    // Update progress bar
    updateProgressBar(totalCalories, goal);
}

/**
 * Update the progress bar visual
 * 
 * @param {number} current - Current calories eaten
 * @param {number} goal - Calorie goal
 */
function updateProgressBar(current, goal) {
    const progressBar = document.getElementById('calorieProgress');
    
    if (!progressBar) return;
    
    // Calculate percentage (max 100%)
    const percentage = Math.min((current / goal) * 100, 100);
    
    // Update width with animation
    progressBar.style.width = percentage + '%';
    
    // Change color if over goal
    if (percentage >= 100) {
        progressBar.style.background = 'linear-gradient(90deg, #F4A261 0%, #E76F51 100%)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #2A9D8F 0%, #E9C46A 100%)';
    }
}

/**
 * Update the workout card with today's workout info
 */
function updateWorkoutCard() {
    const workoutDisplay = document.getElementById('todayWorkout');
    
    if (!workoutDisplay) return;
    
    const todaysWorkouts = getTodaysWorkouts();
    
    if (todaysWorkouts.length === 0) {
        // Show empty state
        workoutDisplay.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💪</div>
                <p>No workout scheduled for today</p>
            </div>
        `;
    } else {
        // Show most recent workout
        const lastWorkout = todaysWorkouts[todaysWorkouts.length - 1];
        workoutDisplay.innerHTML = `
            <div class="workout-title">${lastWorkout.name}</div>
            <div class="workout-details">
                ${lastWorkout.duration} min • ${lastWorkout.sets} sets × ${lastWorkout.reps} reps
            </div>
        `;
    }
}

/**
 * Update the statistics cards (streak, weekly workouts)
 */
function updateStatsCards() {
    updateWeeklyWorkouts();
    updateStreak();
}

/**
 * Update the weekly workouts counter
 */
function updateWeeklyWorkouts() {
    const weekWorkoutsElement = document.getElementById('weekWorkouts');
    
    if (!weekWorkoutsElement) return;
    
    const recentWorkouts = getRecentWorkouts(7);
    weekWorkoutsElement.textContent = recentWorkouts.length;
    
    // Add animation when count changes
    weekWorkoutsElement.classList.add('stat-update');
    setTimeout(() => {
        weekWorkoutsElement.classList.remove('stat-update');
    }, 300);
}

/**
 * Update the current streak counter
 */
function updateStreak() {
    const streakElement = document.getElementById('currentStreak');
    
    if (!streakElement) return;
    
    const streak = calculateStreak();
    streakElement.textContent = streak;
    
    // Add animation when count changes
    streakElement.classList.add('stat-update');
    setTimeout(() => {
        streakElement.classList.remove('stat-update');
    }, 300);
}

/**
 * Display today's meals in the meals section
 */
export function displayTodaysMeals() {
    const mealListElement = document.getElementById('mealList');
    const mealsSection = document.getElementById('meals');
    
    if (!mealListElement || !mealsSection) return;
    
    const todaysMeals = getTodaysMeals();
    
    if (todaysMeals.length === 0) {
        mealListElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🍽️</div>
                <p>No meals logged today</p>
            </div>
        `;
    } else {
        // Group meals by type
        const mealsByType = groupMealsByType(todaysMeals);
        
        mealListElement.innerHTML = Object.entries(mealsByType)
            .map(([type, meals]) => `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: #2A9D8F; text-transform: capitalize; margin-bottom: 0.75rem;">
                        ${type}
                    </h3>
                    ${meals.map(meal => `
                        <div class="meal-entry">
                            <div>
                                <div class="meal-name">${meal.name}</div>
                            </div>
                            <div class="meal-calories">${meal.calories} cal</div>
                        </div>
                    `).join('')}
                </div>
            `).join('');
    }
    
    // Show the meals section
    mealsSection.style.display = 'block';
    
    // Smooth scroll to meals section
    mealsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Group meals by their type (breakfast, lunch, dinner, snack)
 * 
 * @param {Array} meals - Array of meal objects
 * @returns {Object} Meals grouped by type
 */
function groupMealsByType(meals) {
    const grouped = {};
    
    meals.forEach(meal => {
        const type = meal.type || 'other';
        if (!grouped[type]) {
            grouped[type] = [];
        }
        grouped[type].push(meal);
    });
    
    return grouped;
}

/**
 * Show a success message on the dashboard
 * 
 * @param {string} message - Message to display
 */
export function showSuccessMessage(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Show an error message on the dashboard
 * 
 * @param {string} message - Error message to display
 */
export function showErrorMessage(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Format a date string for display
 * 
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Calculate and display weekly summary
 * Could be expanded to show more detailed analytics
 */
export function displayWeeklySummary() {
    const workouts = getRecentWorkouts(7);
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const uniqueDays = new Set(workouts.map(w => w.date)).size;
    
    console.log('Weekly Summary:');
    console.log(`- Total Workouts: ${workouts.length}`);
    console.log(`- Total Duration: ${totalDuration} minutes`);
    console.log(`- Active Days: ${uniqueDays} / 7`);
    
    // Could render this to the UI in a future version
}