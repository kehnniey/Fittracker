/**
 * MAIN APPLICATION FILE
 * 
 * This is the entry point for the Workout & Fitness Dashboard
 * It coordinates all modules and handles user interactions
 * 
 * Modules Used:
 * - wger.mjs: Exercise data from Wger API
 * - nutritionix.mjs: Food/nutrition data from Nutritionix API
 * - storage.mjs: LocalStorage management
 * - dashboard.mjs: Dashboard UI updates
 */

// Import API modules
import { fetchExercises, searchExercises as filterExercises } from './api/exercisedb.mjs';
import { searchFood as searchUSDA, isConfigured as isUSDAConfigured, getSampleFoods } from './api/usda.mjs';

// Import storage functions
import { addMeal, addWorkout, loadWorkouts, loadMeals, getMealsForDate, calculateStreak } from './modules/storage.mjs';

// Import dashboard functions
import { updateDashboard, displayTodaysMeals, showSuccessMessage, showErrorMessage } from './modules/dashboard.mjs';


// ====================
// GLOBAL STATE
// ====================
let exercises = []; // Stores all exercises from API
let currentSearchResults = []; // Stores current search/filter results
let foodSearchTimeout; // Debounce timer for food search
let currentRoutine = { name: '', description: '', exercises: [] }; // for routine builder


// ====================
// INITIALIZATION
// ====================

/**
 * Initialize the application
 * Called when DOM is fully loaded
 */
async function initApp() {
    console.log('🏋️ Initializing FitTracker...');
    
    // Load exercises from Wger API
    await loadExercises();
    
    // Update dashboard with stored data
    updateDashboard();
    
    // Set up all event listeners
    setupEventListeners();
    
    console.log('✅ FitTracker initialized successfully');
}

/**
 * Load exercises from Wger API
 */
async function loadExercises() {
    const exerciseList = document.getElementById('exerciseList');
    
    if (!exerciseList) return;
    
    try {
        exerciseList.innerHTML = '<div class="loading">Loading exercises from Wger API...</div>';
        
        // Fetch from API (will use cache/fallback if unavailable)
        exercises = await fetchExercises();
        currentSearchResults = exercises;
        
        // Display exercises
        displayExercises(exercises);
        
    } catch (error) {
        console.error('Error loading exercises:', error);
        exerciseList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>Unable to load exercises</p>
            </div>
        `;
    }
    
}

/**
 * Display exercises in the exercise list
 * 
 * @param {Array} exercisesToShow - Array of exercise objects to display
 */
function displayExercises(exercisesToShow) {
    const exerciseList = document.getElementById('exerciseList');
    
    if (!exerciseList) return;
    
    if (exercisesToShow.length === 0) {
        exerciseList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No exercises found</p>
            </div>
        `;
        return;
    }
    
    // Generate HTML for each exercise
    exerciseList.innerHTML = exercisesToShow.map(exercise => `
        <div class="exercise-item" data-exercise-id="${exercise.id}">
            <div class="exercise-info">
                <h3>${exercise.name}</h3>
                <div class="exercise-meta">
                    ${exercise.category} • ${exercise.equipment} • ${exercise.type}
                </div>
            </div>
            <div class="exercise-actions">
                <button class="btn btn-small btn-log" data-exercise-id="${exercise.id}" data-exercise-name="${escapeHtml(exercise.name)}" title="Log workout">
                    📝 Log
                </button>
                <button class="btn btn-small btn-add" data-exercise-id="${exercise.id}" title="Add to routine">
                    + Add
                </button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to Log buttons
    exerciseList.querySelectorAll('.btn-log').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering parent click
            const exerciseId = parseInt(button.getAttribute('data-exercise-id'));
            const exerciseName = button.getAttribute('data-exercise-name');
            openWorkoutModalWithExercise(exerciseName);
        });
    });
    
    // Add event listeners to Add buttons
    exerciseList.querySelectorAll('.btn-add').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering parent click
            handleAddExercise(e);
        });
    });
}

// ====================
// EVENT LISTENERS SETUP
// ====================

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // Navigation smooth scroll
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Exercise search input
    const exerciseSearch = document.getElementById('exerciseSearch');
    if (exerciseSearch) {
        exerciseSearch.addEventListener('input', handleExerciseSearch);
    }
    
    // Food search input (debounced)
    const foodSearchInput = document.getElementById('foodSearchInput');
    if (foodSearchInput) {
        foodSearchInput.addEventListener('input', handleFoodSearchDebounced);
    }
    
    // Food form submission
    const foodForm = document.querySelector('#foodModal form');
    if (foodForm) {
        foodForm.addEventListener('submit', handleAddFood);
    }
    
    // Workout form submission
    const workoutForm = document.querySelector('#workoutModal form');
    if (workoutForm) {
        workoutForm.addEventListener('submit', handleAddWorkout);
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', closeActiveModal);
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeActiveModal();
        }
    });
    
    // Dashboard buttons - find by text or create specific IDs
    setupDashboardButtons();
}

/**
 * Setup dashboard button event listeners
 */
function setupDashboardButtons() {
    // Find buttons by their text content or ID
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        const text = button.textContent.trim();
        const id = button.id;
        
        if (text === 'Start Workout' || id === 'startWorkoutBtn') {
            button.addEventListener('click', openWorkoutModal);
        } else if (text === '+ Add Food' || id === 'addFoodBtn' || id === 'addFoodBtn2') {
            button.addEventListener('click', openFoodModal);
        } else if (text === 'View Meals' || id === 'viewMealsBtn' || id === 'viewMealsBtn2') {
            button.addEventListener('click', handleViewMeals);
        }
    });
    
    // Update progress stats
    updateProgressStats();
    updateNutritionStats();
}

/**
 * Update progress section statistics
 */
function updateProgressStats() {
    const workouts = loadWorkouts();
    const meals = loadMeals();
    
    // Total workouts
    const totalWorkoutsElement = document.getElementById('totalWorkouts');
    if (totalWorkoutsElement) {
        totalWorkoutsElement.textContent = workouts.length;
    }
    
    // Average calories per day
    const avgCaloriesElement = document.getElementById('avgCalories');
    if (avgCaloriesElement && meals.length > 0) {
        const uniqueDates = [...new Set(meals.map(m => m.date))];
        const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
        const avgCalories = Math.round(totalCalories / uniqueDates.length);
        avgCaloriesElement.textContent = avgCalories;
    }
    
    // Longest streak
    const longestStreakElement = document.getElementById('longestStreak');
    if (longestStreakElement) {
        const streak = calculateStreak();
        longestStreakElement.textContent = streak;
    }
}

/**
 * Update nutrition section statistics
 */
function updateNutritionStats() {
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = getMealsForDate(today);
    const totalCalories = todaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    
    const nutritionCaloriesElement = document.getElementById('nutritionCalories');
    if (nutritionCaloriesElement) {
        nutritionCaloriesElement.textContent = totalCalories;
    }
    
    const nutritionMealsElement = document.getElementById('nutritionMeals');
    if (nutritionMealsElement) {
        nutritionMealsElement.textContent = todaysMeals.length;
    }
}

// ====================
// EXERCISE HANDLERS
// ====================

/**
 * Handle exercise search input
 */
function handleExerciseSearch(event) {
    const query = event.target.value;
    
    // Filter exercises using imported function
    currentSearchResults = filterExercises(exercises, query);
    
    // Display filtered results
    displayExercises(currentSearchResults);
}

/**
 * Handle adding exercise to routine
 */
function handleAddExercise(event) {
    const button = event.target;
    const exerciseId = parseInt(button.getAttribute('data-exercise-id'));
    const exercise = exercises.find(ex => ex.id === exerciseId);
    
    if (!exercise) return;

     // Add to routine
    currentRoutine.exercises.push({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        equipment: exercise.equipment,
        type: exercise.type
            });

    
    // For now, just show success message
    // In Week 6, this will integrate with routine builder
    showSuccessMessage(`Added ${exercise.name} to your routine!`);
}

// ====================
// updateRoutine
// ====================


function updateRoutineUI() {
    const routineList = document.getElementById('routineList'); // make a div in HTML
    if (!routineList) return;

    if (currentRoutine.exercises.length === 0) {
        routineList.innerHTML = '<p>No exercises in routine yet.</p>';
        return;
    }

    routineList.innerHTML = currentRoutine.exercises.map(ex => `
        <div class="routine-item" data-id="${ex.id}">
            ${ex.name} • ${ex.category} • ${ex.equipment}
            <button class="btn btn-small btn-remove" data-id="${ex.id}">❌</button>
        </div>
    `).join('');

    // Add remove buttons
    routineList.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idToRemove = parseInt(btn.getAttribute('data-id'));
            currentRoutine.exercises = currentRoutine.exercises.filter(ex => ex.id !== idToRemove);
            updateRoutineUI();
        });
    });
}


// ====================
// Save Routine
// ====================

function saveRoutine() {
    localStorage.setItem('currentRoutine', JSON.stringify(currentRoutine));
}

function loadRoutine() {
    const stored = localStorage.getItem('currentRoutine');
    if (stored) {
        currentRoutine = JSON.parse(stored);
        updateRoutineUI();
    }
}

// ====================
// MODAL MANAGEMENT
// ====================

/**
 * Open the food modal
 */
function openFoodModal() {
    const modal = document.getElementById('foodModal');
    if (modal) {
        modal.classList.add('active');
        // Focus on search input
        setTimeout(() => {
            const searchInput = document.getElementById('foodSearchInput');
            if (searchInput) searchInput.focus();
        }, 100);
    }
}

/**
 * Close the food modal
 */
function closeFoodModal() {
    const modal = document.getElementById('foodModal');
    if (modal) {
        modal.classList.remove('active');
        // Clear search results
        const searchResults = document.getElementById('foodSearchResults');
        const searchInput = document.getElementById('foodSearchInput');
        if (searchResults) searchResults.innerHTML = '';
        if (searchInput) searchInput.value = '';
    }
}

/**
 * Open the workout modal
 */
function openWorkoutModal() {
    const modal = document.getElementById('workoutModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Open workout modal with pre-filled exercise name
 * @param {string} exerciseName - Name of the exercise to log
 */
function openWorkoutModalWithExercise(exerciseName) {
    const modal = document.getElementById('workoutModal');
    const nameInput = document.getElementById('workoutName');
    
    if (modal && nameInput) {
        nameInput.value = exerciseName;
        modal.classList.add('active');
        
        // Focus on duration field since name is already filled
        setTimeout(() => {
            document.getElementById('workoutDuration')?.focus();
        }, 100);
    }
}

/**
 * Close the workout modal
 */
function closeWorkoutModal() {
    const modal = document.getElementById('workoutModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Close any active modal
 */
function closeActiveModal() {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
        activeModal.classList.remove('active');
    }
}

// ====================
// FOOD SEARCH (Nutritionix)
// ====================

/**
 * Debounced food search
 * Waits 500ms after user stops typing before searching
 */
function handleFoodSearchDebounced() {
    clearTimeout(foodSearchTimeout);
    foodSearchTimeout = setTimeout(performFoodSearch, 500);
}

/**
 * Perform food search using USDA FoodData Central API
 */
async function performFoodSearch() {
    const searchInput = document.getElementById('foodSearchInput');
    const resultsDiv = document.getElementById('foodSearchResults');
    
    if (!searchInput || !resultsDiv) return;
    
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    resultsDiv.innerHTML = '<div style="padding: 1rem; color: #666;">Searching USDA database...</div>';
    
    try {
        let foods;
        
        // Search using USDA API (works with DEMO_KEY or real key)
        foods = await searchUSDA(query);
        
        if (foods.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 1rem; color: #666;">No results found</div>';
            return;
        }
        
        // Display search results
        resultsDiv.innerHTML = foods.slice(0, 5).map(food => `
            <div class="food-result" data-food-name="${escapeHtml(food.name)}" data-food-calories="${food.calories}">
                <strong>${escapeHtml(food.name)}</strong>
                <div style="font-size: 0.85rem; color: #666;">
                    ${food.calories} cal
                    ${food.protein ? ` • ${food.protein}g protein` : ''}
                    ${food.carbs ? ` • ${food.carbs}g carbs` : ''}
                    ${food.fat ? ` • ${food.fat}g fat` : ''}
                </div>
                ${food.brandOwner ? `<div style="font-size: 0.75rem; color: #999;">${escapeHtml(food.brandOwner)}</div>` : ''}
            </div>
        `).join('');
        
        // Add click listeners to food results
        resultsDiv.querySelectorAll('.food-result').forEach(item => {
            item.addEventListener('click', handleSelectFood);
        });
        
        // Show API notice if using DEMO_KEY
        if (!isUSDAConfigured()) {
            resultsDiv.innerHTML = `
                <div style="background: #e3f2fd; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; font-size: 0.85rem; border-left: 4px solid #2196f3;">
                    <strong>Using USDA FoodData Central</strong><br>
                    <small>Using DEMO_KEY (limited requests). Get your free API key at <a href="https://fdc.nal.usda.gov/api-key-signup.html" target="_blank" style="color: #1976d2;">fdc.nal.usda.gov</a></small>
                </div>
            ` + resultsDiv.innerHTML;
        }
        
    } catch (error) {
        console.error('Food search error:', error);
        resultsDiv.innerHTML = `
            <div style="background: #ffebee; padding: 1rem; border-radius: 4px; color: #c62828;">
                <strong>Search Error</strong><br>
                <small>${error.message}</small>
            </div>
        `;
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handle selecting a food from search results
 */
function handleSelectFood(event) {
    const item = event.currentTarget;
    const name = item.getAttribute('data-food-name');
    const calories = item.getAttribute('data-food-calories');
    
    // Fill in the manual entry form
    document.getElementById('foodName').value = name;
    document.getElementById('foodCalories').value = calories;
    
    // Clear search
    document.getElementById('foodSearchResults').innerHTML = '';
    document.getElementById('foodSearchInput').value = '';
}

// ====================
// ADD FOOD FORM
// ====================

/**
 * Handle food form submission
 * 
 * @param {Event} event - Form submit event
 */
function handleAddFood(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('foodName').value;
    const calories = parseInt(document.getElementById('foodCalories').value);
    const type = document.getElementById('mealType').value;
    
    // Validate
    if (!name || isNaN(calories) || calories < 0) {
        showErrorMessage('Please enter valid food information');
        return;
    }
    
    // Create meal object
    const meal = {
        name: name,
        calories: calories,
        type: type
    };
    
    // Save to storage
    const success = addMeal(meal);
    
    if (success) {
        // Update dashboard
        updateDashboard();
        
        // Show success message
        showSuccessMessage(`Added ${name} (${calories} cal)`);
        
        // Close modal
        closeFoodModal();
        
        // Reset form
        event.target.reset();
    } else {
        showErrorMessage('Failed to add food');
    }
}

// ====================
// ADD WORKOUT FORM
// ====================

/**
 * Handle workout form submission
 * 
 * @param {Event} event - Form submit event
 */
function handleAddWorkout(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('workoutName').value;
    const duration = parseInt(document.getElementById('workoutDuration').value);
    const sets = parseInt(document.getElementById('workoutSets').value);
    const reps = parseInt(document.getElementById('workoutReps').value);
    
    // Validate
    if (!name || isNaN(duration) || duration < 1) {
        showErrorMessage('Please enter valid workout information');
        return;
    }
    
    // Create workout object
    const workout = {
        name: name,
        duration: duration,
        sets: sets,
        reps: reps
    };
    
    // Save to storage
    const success = addWorkout(workout);
    
    if (success) {
        // Update dashboard
        updateDashboard();
        
        // Show success message
        showSuccessMessage(`Logged ${name} workout!`);
        
        // Close modal
        closeWorkoutModal();
        
        // Reset form
        event.target.reset();
    } else {
        showErrorMessage('Failed to log workout');
    }
}

// ====================
// VIEW MEALS
// ====================

/**
 * Show today's meals section
 */
function handleViewMeals() {
    displayTodaysMeals();
}

// ====================
// START APPLICATION
// ====================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM is already loaded
    initApp();
    
const placeholder = document.querySelector('#progressCard img');
const chartCanvas = document.getElementById('progressChart');

if (chartCanvas) {
    chartCanvas.style.display = 'block';   // show the chart
    if (placeholder) placeholder.style.display = 'none'; // hide placeholder
    renderProgressChart();                  // your chart function
}

    
}

// Ensure renderProgressChart exists before calling
if (chartCanvas && typeof renderProgressChart === 'function') {
    chartCanvas.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    renderProgressChart();
}



