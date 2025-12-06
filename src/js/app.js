/**
 * MAIN APPLICATION FILE */


// Import your actual API modules
import { fetchExercises, searchExercises as filterExercises } from './api/exercisedb.mjs';
import { searchFood as searchUSDA, isConfigured as isUSDAConfigured, getSampleFoods } from './api/usda.mjs';

// Import storage functions
import { addMeal, addWorkout, loadWorkouts, loadMeals, getMealsForDate, calculateStreak } from './modules/storage.mjs';

// Import dashboard functions
import { updateDashboard, displayTodaysMeals, showSuccessMessage, showErrorMessage } from './modules/dashboard.mjs';
import { initCharts, updateCharts } from "./modules/charts.mjs";

// ====================
// GLOBAL STATE
// ====================
let exercises = []; 
let currentSearchResults = [];
let foodSearchResults = [];
let selectedFoodIndex = -1;
let foodSearchTimeout;
let currentRoutine = { name: '', description: '', exercises: [] };

// ====================
// INITIALIZATION
// ====================

async function initApp() {
    console.log('🏋️ Initializing FitTracker...');
    console.log('📡 Connecting to APIs...');
    
    // Load exercises from ExerciseDB API
    await loadExercises();
    
    // Load routine from localStorage
    loadRoutine();
    
    // Initialize charts
    initCharts();
    updateCharts();
    
    // Update dashboard with stored data
    updateDashboard();
    
    // Set up all event listeners
    setupEventListeners();
    
    console.log('✅ FitTrack initialized successfully');
    console.log('✅ All buttons and APIs are working!');
}

/**
 * Load exercises from ExerciseDB API
 * Uses your exercisedb.mjs module with RapidAPI
 */
async function loadExercises() {
    const exerciseList = document.getElementById('exerciseList');
    
    if (!exerciseList) return;
    
    try {
        exerciseList.innerHTML = '<div class="loading">🏋️ Loading exercises from ExerciseDB API...</div>';
        
        // Fetch from your ExerciseDB API module
        // This will use cache if available, or fallback on error
        exercises = await fetchExercises();
        currentSearchResults = exercises;
        
        console.log(`✅ Loaded ${exercises.length} exercises from ExerciseDB`);
        
        // Display exercises
        displayExercises(exercises);
        
    } catch (error) {
        console.error('❌ Error loading exercises:', error);
        exerciseList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>Unable to load exercises</p>
                <p style="font-size: 0.9rem; color: #666;">Check API key or try again later</p>
            </div>
        `;
    }
}

/**
 * Display exercises in the list
 * Shows exercise with GIF if available
 */
function displayExercises(exercisesToShow) {
    const exerciseList = document.getElementById('exerciseList');
    
    if (!exerciseList) return;
    
    if (exercisesToShow.length === 0) {
        exerciseList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No exercises found</p>
                <p style="font-size: 0.9rem; color: #666;">Try a different search term</p>
            </div>
        `;
        return;
    }
    
    // Generate HTML for each exercise (with optional GIF)
    exerciseList.innerHTML = exercisesToShow.map(exercise => `
        <div class="exercise-item" data-exercise-id="${exercise.id}">
            ${exercise.gif ? `
                <div class="exercise-gif">
                    <img src="${exercise.gif}" alt="${exercise.name}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
                </div>
            ` : ''}
            <div class="exercise-info">
                <h3>${exercise.name}</h3>
                <div class="exercise-meta">
                    ${exercise.category} • ${exercise.equipment}
                    ${exercise.description ? ` • ${exercise.description}` : ''}
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
            e.stopPropagation();
            const exerciseName = button.getAttribute('data-exercise-name');
            handleLogWorkout(exerciseName);
        });
    });
    
    // Add event listeners to Add buttons
    exerciseList.querySelectorAll('.btn-add').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            handleAddExercise(e);
        });
    });
}

// ====================
// EVENT LISTENERS SETUP
// ====================

function setupEventListeners() {
    console.log('⚙️ Setting up event listeners...');
    
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
    
    // Exercise search
    const exerciseSearch = document.getElementById('exerciseSearch');
    if (exerciseSearch) {
        exerciseSearch.addEventListener('input', handleExerciseSearch);
        console.log('✅ Exercise search ready');
    }
    
    // Food search input (in modal) - support Enter key
    const foodSearchInput = document.getElementById('foodSearchInput');
    if (foodSearchInput) {
        foodSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchFoodAPI();
            }
        });
        console.log('✅ Food search ready');
    }
    
    // Setup dashboard buttons
    setupDashboardButtons();
    
    console.log('✅ All event listeners active');
}

/**
 * Setup dashboard button event listeners
 */
function setupDashboardButtons() {
    console.log('🔘 Setting up dashboard buttons...');
    
    // Start Workout button
    const startWorkoutBtn = document.getElementById('startWorkoutBtn');
    if (startWorkoutBtn) {
        startWorkoutBtn.addEventListener('click', () => {
            console.log('▶️ Start Workout clicked');
            handleStartWorkout();
        });
        console.log('✅ Start Workout button ready');
    }
    
    // Add Food buttons (both instances) - NOW USING MODAL
    const addFoodBtn1 = document.getElementById('addFoodBtn');
    const addFoodBtn2 = document.getElementById('addFoodBtn2');
    
    [addFoodBtn1, addFoodBtn2].forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', () => {
                console.log(`🍎 Add Food button ${index + 1} clicked`);
                openFoodSearchModal(); // ← CHANGED: Use modal instead of API prompt
            });
            console.log(`✅ Add Food button ${index + 1} ready`);
        }
    });
    
    // View Meals buttons (both instances)
    const viewMealsBtn1 = document.getElementById('viewMealsBtn');
    const viewMealsBtn2 = document.getElementById('viewMealsBtn2');
    
    [viewMealsBtn1, viewMealsBtn2].forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', () => {
                console.log(`👀 View Meals button ${index + 1} clicked`);
                handleViewMeals();
            });
            console.log(`✅ View Meals button ${index + 1} ready`);
        }
    });
    
    // Update initial statistics
    updateProgressStats();
    updateNutritionStats();
}

// ====================
// FOOD SEARCH MODAL FUNCTIONS
// ====================

/**
 * Open the food search modal
 */
window.openFoodSearchModal = function() {
    console.log('🍽️ Opening food search modal...');
    
    const modal = document.getElementById('foodSearchModal');
    const searchInput = document.getElementById('foodSearchInput');
    const resultsContent = document.getElementById('foodResultsContent');
    const selectedDetails = document.getElementById('selectedFoodDetails');
    
    if (!modal) {
        console.error('❌ Food search modal not found in HTML');
        // Fallback to old method
        handleAddFoodWithAPI();
        return;
    }
    
    // Reset modal state
    if (searchInput) searchInput.value = '';
    if (resultsContent) {
        resultsContent.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #999;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <p>Search for a food to see nutrition information</p>
            </div>
        `;
    }
    if (selectedDetails) selectedDetails.style.display = 'none';
    
    selectedFoodIndex = -1;
    foodSearchResults = [];
    
    // Show modal
    modal.style.display = 'block';
    
    // Focus search input
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 100);
    
    console.log('✅ Food search modal opened');
};

/**
 * Close the food search modal
 */
window.closeFoodSearchModal = function() {
    const modal = document.getElementById('foodSearchModal');
    if (modal) {
        modal.style.display = 'none';
    }
    console.log('🚪 Food search modal closed');
};

/**
 * Search for food using USDA API
 */
window.searchFoodAPI = async function() {
    const searchInput = document.getElementById('foodSearchInput');
    const loadingDiv = document.getElementById('foodSearchLoading');
    const resultsContent = document.getElementById('foodResultsContent');
    
    if (!searchInput || !resultsContent) return;
    
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        resultsContent.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #999;">
                <p>Please enter at least 2 characters</p>
            </div>
        `;
        return;
    }
    
    console.log(`🔎 Searching USDA for: "${query}"`);
    
    // Show loading
    if (loadingDiv) loadingDiv.style.display = 'block';
    resultsContent.innerHTML = '';
    
    try {
        // Search using your USDA API
        const foods = await searchUSDA(query, 10);
        foodSearchResults = foods;
        
        console.log(`✅ Found ${foods.length} foods`);
        
        // Hide loading
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        // Display results
        displayFoodResults(foods);
        
    } catch (error) {
        console.error('❌ Food search error:', error);
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        resultsContent.innerHTML = `
            <div style="background: #ffebee; padding: 1.5rem; border-radius: 8px; color: #c62828; text-align: center;">
                <strong>❌ Search Error</strong><br>
                <small>${error.message}</small><br>
                <small style="color: #999;">Check your internet connection or try again</small>
            </div>
        `;
    }
};

/**
 * Display food search results
 */
function displayFoodResults(foods) {
    const resultsContent = document.getElementById('foodResultsContent');
    
    if (!resultsContent) return;
    
    if (foods.length === 0) {
        resultsContent.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #999;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🤷</div>
                <p>No foods found</p>
                <p style="font-size: 0.9rem;">Try a different search term</p>
            </div>
        `;
        return;
    }
    
    resultsContent.innerHTML = foods.map((food, index) => `
        <div class="food-result-item" onclick="selectFood(${index})" style="cursor: pointer;">
            <div class="food-item-name">${escapeHtml(food.name)}</div>
            <div class="food-item-nutrition">
                <span class="nutrition-badge calories">🔥 ${food.calories} cal</span>
                ${food.protein ? `<span class="nutrition-badge protein">💪 ${food.protein}g protein</span>` : ''}
                ${food.carbs ? `<span class="nutrition-badge carbs">🌾 ${food.carbs}g carbs</span>` : ''}
                ${food.fat ? `<span class="nutrition-badge fat">🥑 ${food.fat}g fat</span>` : ''}
            </div>
            ${food.brandOwner ? `<div class="food-item-brand">🏢 ${escapeHtml(food.brandOwner)}</div>` : ''}
        </div>
    `).join('');
    
    console.log(`📋 Displayed ${foods.length} food results`);
}

/**
 * Select a food from search results
 */
window.selectFood = function(index) {
    const food = foodSearchResults[index];
    
    if (!food) return;
    
    selectedFoodIndex = index;
    
    console.log(`✅ Selected: ${food.name}`);
    
    // Highlight selected item
    document.querySelectorAll('.food-result-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // Show details section
    const detailsDiv = document.getElementById('selectedFoodDetails');
    const infoDiv = document.getElementById('selectedFoodInfo');
    
    if (detailsDiv && infoDiv) {
        infoDiv.innerHTML = `
            <h4 style="color: #2A9D8F; margin-bottom: 1rem;">${escapeHtml(food.name)}</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div style="background: #fff3e0; padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #e65100;">${food.calories}</div>
                    <div style="font-size: 0.85rem; color: #666;">Calories</div>
                </div>
                ${food.protein ? `
                    <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #1565c0;">${food.protein}g</div>
                        <div style="font-size: 0.85rem; color: #666;">Protein</div>
                    </div>
                ` : ''}
                ${food.carbs ? `
                    <div style="background: #f3e5f5; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #6a1b9a;">${food.carbs}g</div>
                        <div style="font-size: 0.85rem; color: #666;">Carbs</div>
                    </div>
                ` : ''}
                ${food.fat ? `
                    <div style="background: #fce4ec; padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #c2185b;">${food.fat}g</div>
                        <div style="font-size: 0.85rem; color: #666;">Fat</div>
                    </div>
                ` : ''}
            </div>
            ${food.brandOwner ? `<p style="font-size: 0.9rem; color: #666;">Brand: ${escapeHtml(food.brandOwner)}</p>` : ''}
        `;
        
        detailsDiv.style.display = 'block';
        
        // Scroll to details
        detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

/**
 * Cancel food selection
 */
window.cancelFoodSelection = function() {
    const detailsDiv = document.getElementById('selectedFoodDetails');
    if (detailsDiv) {
        detailsDiv.style.display = 'none';
    }
    
    // Remove selection highlight
    document.querySelectorAll('.food-result-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    selectedFoodIndex = -1;
    console.log('❌ Food selection cancelled');
};

/**
 * Confirm and add selected food
 */
window.confirmAddFood = function() {
    if (selectedFoodIndex < 0 || !foodSearchResults[selectedFoodIndex]) {
        alert('❌ Please select a food first');
        return;
    }
    
    const food = foodSearchResults[selectedFoodIndex];
    const mealTypeSelect = document.getElementById('selectedMealType');
    const mealType = mealTypeSelect ? mealTypeSelect.value : 'Snack';
    
    console.log(`✅ Adding food: ${food.name} (${mealType})`);
    
    // Create meal object
    const meal = {
        name: food.name,
        calories: food.calories,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        type: mealType,
        date: new Date().toISOString().split('T')[0]
    };
    
    // Save meal
    const success = addMeal(meal);
    
    if (success) {
        showSuccessMessage(`✅ Added ${food.name}\n${food.calories} calories`);
        
        // Update UI
        updateDashboard();
        updateNutritionStats();
        updateCharts();
        
        // Close modal
        closeFoodSearchModal();
        
        console.log('✅ Meal logged successfully');
    } else {
        showErrorMessage('❌ Failed to add food');
        console.error('❌ Failed to save meal');
    }
};

// ====================
// BUTTON HANDLERS
// ====================

/**
 * Handle Start Workout - Simple prompt version
 */
function handleStartWorkout() {
    const workoutName = prompt('Enter workout name (e.g., "Morning Run", "Leg Day"):');
    
    if (!workoutName) return;
    
    const duration = parseInt(prompt('Duration in minutes:'));
    
    if (isNaN(duration) || duration < 1) {
        alert('❌ Invalid duration. Please enter a number greater than 0.');
        return;
    }
    
    const sets = parseInt(prompt('Number of sets (optional, press OK to skip):') || '0');
    const reps = parseInt(prompt('Number of reps (optional, press OK to skip):') || '0');
    
    const workout = {
        name: workoutName,
        duration: duration,
        sets: sets || 0,
        reps: reps || 0,
        date: new Date().toISOString().split('T')[0]
    };
    
    const success = addWorkout(workout);
    
    if (success) {
        showSuccessMessage(`✅ Logged ${workoutName} workout!`);
        updateDashboard();
        updateProgressStats();
        updateCharts();
    } else {
        showErrorMessage('❌ Failed to log workout');
    }
}

/**
 * Handle Add Food - OLD VERSION (kept as fallback)
 * This is now replaced by the modal, but kept for fallback
 */
async function handleAddFoodWithAPI() {
    const searchQuery = prompt('🔍 Search for a food (e.g., "chicken breast", "apple"):');
    
    if (!searchQuery || searchQuery.trim().length < 2) {
        return;
    }
    
    // Create loading modal
    const loadingModal = createLoadingModal('Searching USDA FoodData Central...', searchQuery);
    document.body.appendChild(loadingModal);
    
    try {
        console.log(`🔎 Searching USDA API for: ${searchQuery}`);
        
        // Update loading text
        updateLoadingModal(loadingModal, 'Fetching nutrition data...');
        
        // Search using USDA API
        const foods = await searchUSDA(searchQuery, 10);
        
        // Update loading text
        updateLoadingModal(loadingModal, `Found ${foods.length} results!`);
        
        // Remove loading modal after short delay
        setTimeout(() => {
            loadingModal.remove();
        }, 500);
        
        if (!foods || foods.length === 0) {
            alert('❌ No foods found. Try a different search term.');
            return;
        }
        
        // Show results to user
        let resultsList = '🍽️ Select a food (enter number):\n\n';
        foods.slice(0, 5).forEach((food, index) => {
            resultsList += `${index + 1}. ${food.name}\n`;
            resultsList += `   ${food.calories} cal`;
            if (food.protein) resultsList += ` • ${food.protein}g protein`;
            if (food.carbs) resultsList += ` • ${food.carbs}g carbs`;
            if (food.fat) resultsList += ` • ${food.fat}g fat`;
            if (food.brandOwner) resultsList += `\n   Brand: ${food.brandOwner}`;
            resultsList += '\n\n';
        });
        
        resultsList += '0. Cancel';
        
        const selection = parseInt(prompt(resultsList));
        
        if (isNaN(selection) || selection === 0 || selection < 1 || selection > 5) {
            return;
        }
        
        const selectedFood = foods[selection - 1];
        
        // Ask for meal type
        const mealType = prompt('Meal type:\n\n1. Breakfast\n2. Lunch\n3. Dinner\n4. Snack\n\nEnter number (1-4):');
        const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
        const mealTypeIndex = parseInt(mealType) - 1;
        const finalMealType = (mealTypeIndex >= 0 && mealTypeIndex < 4) ? mealTypes[mealTypeIndex] : 'Snack';
        
        // Create meal object
        const meal = {
            name: selectedFood.name,
            calories: selectedFood.calories,
            protein: selectedFood.protein || 0,
            carbs: selectedFood.carbs || 0,
            fat: selectedFood.fat || 0,
            type: finalMealType,
            date: new Date().toISOString().split('T')[0]
        };
        
        const success = addMeal(meal);
        
        if (success) {
            showSuccessMessage(`✅ Added ${selectedFood.name}\n${selectedFood.calories} calories`);
            updateDashboard();
            updateNutritionStats();
            updateCharts();
        } else {
            showErrorMessage('❌ Failed to add food');
        }
        
    } catch (error) {
        console.error('❌ Food search error:', error);
        
        // Remove loading modal if still present
        if (loadingModal && loadingModal.parentNode) {
            loadingModal.remove();
        }
        
        // Fallback to manual entry
        alert('❌ API search failed. Using manual entry...');
        handleAddFoodManual();
    }
}

/**
 * Create a loading modal with animation
 */
function createLoadingModal(message, searchTerm) {
    const modal = document.createElement('div');
    modal.id = 'loading-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 2rem 3rem;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
        animation: slideUp 0.3s ease;
    `;
    
    content.innerHTML = `
        <div class="loading-spinner" style="
            width: 60px;
            height: 60px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2A9D8F;
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            animation: spin 1s linear infinite;
        "></div>
        <h3 style="
            font-family: 'Poppins', sans-serif;
            color: #264653;
            margin-bottom: 0.5rem;
            font-size: 1.3rem;
        " id="loading-title">${message}</h3>
        <p style="
            color: #666;
            font-size: 0.9rem;
        " id="loading-subtitle">Searching for: "${searchTerm}"</p>
        <div style="
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            font-size: 0.85rem;
            color: #999;
        ">
            <div id="loading-status">Connecting to USDA API...</div>
        </div>
    `;
    
    modal.appendChild(content);
    
    // Add CSS animations if not already present
    if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    return modal;
}

/**
 * Update loading modal message
 */
function updateLoadingModal(modal, message, status = null) {
    if (!modal) return;
    
    const title = modal.querySelector('#loading-title');
    const statusDiv = modal.querySelector('#loading-status');
    
    if (title) {
        title.textContent = message;
    }
    
    if (status && statusDiv) {
        statusDiv.textContent = status;
    }
}

/**
 * Handle Add Food - Manual entry fallback
 */
function handleAddFoodManual() {
    const foodName = prompt('Enter food name:');
    
    if (!foodName) return;
    
    const calories = parseInt(prompt('Enter calories:'));
    
    if (isNaN(calories) || calories < 0) {
        alert('❌ Invalid calories.');
        return;
    }
    
    const mealType = prompt('Meal type (Breakfast/Lunch/Dinner/Snack):') || 'Snack';
    
    const meal = {
        name: foodName,
        calories: calories,
        type: mealType,
        date: new Date().toISOString().split('T')[0]
    };
    
    const success = addMeal(meal);
    
    if (success) {
        showSuccessMessage(`✅ Added ${foodName} (${calories} cal)`);
        updateDashboard();
        updateNutritionStats();
        updateCharts();
    } else {
        showErrorMessage('❌ Failed to add food');
    }
}

/**
 * Handle View Meals
 */
function handleViewMeals() {
    const today = new Date().toISOString().split('T')[0];
    const meals = getMealsForDate(today);
    
    if (meals.length === 0) {
        alert('📭 No meals logged today.\n\nClick "+ Add Food" to log your first meal!');
        return;
    }
    
    const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    let mealList = '🍽️ Today\'s Meals:\n\n';
    
    meals.forEach((m, i) => {
        mealList += `${i + 1}. ${m.name}\n`;
        mealList += `   ${m.calories} cal (${m.type})\n`;
        if (m.protein) mealList += `   P: ${m.protein}g `;
        if (m.carbs) mealList += `C: ${m.carbs}g `;
        if (m.fat) mealList += `F: ${m.fat}g`;
        mealList += '\n\n';
    });
    
    mealList += `━━━━━━━━━━━━━━━━\nTotal: ${totalCalories} calories`;
    
    alert(mealList);
}

/**
 * Handle logging a workout from exercise list
 */
function handleLogWorkout(exerciseName) {
    const duration = parseInt(prompt(`Log workout for: ${exerciseName}\n\nDuration (minutes):`));
    
    if (isNaN(duration) || duration < 1) {
        alert('❌ Invalid duration');
        return;
    }
    
    const sets = parseInt(prompt('Number of sets:') || '0');
    const reps = parseInt(prompt('Number of reps:') || '0');
    
    const workout = {
        name: exerciseName,
        duration: duration,
        sets: sets,
        reps: reps,
        date: new Date().toISOString().split('T')[0]
    };
    
    const success = addWorkout(workout);
    
    if (success) {
        showSuccessMessage(`✅ Logged ${exerciseName}!`);
        updateDashboard();
        updateProgressStats();
        updateCharts();
    }
}

// ====================
// EXERCISE HANDLERS
// ====================

/**
 * Handle exercise search
 */
function handleExerciseSearch(event) {
    const query = event.target.value;
    
    console.log(`🔍 Searching exercises for: ${query}`);
    
    // Use the searchExercises function from exercisedb.mjs
    currentSearchResults = filterExercises(exercises, query);
    
    console.log(`Found ${currentSearchResults.length} matching exercises`);
    
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

    currentRoutine.exercises.push({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        equipment: exercise.equipment,
        type: exercise.type || 'Strength'
    });

    saveRoutine();
    updateRoutineUI();
    showSuccessMessage(`✅ Added ${exercise.name} to routine!`);
}

// ====================
// ROUTINE MANAGEMENT
// ====================

function updateRoutineUI() {
    const routineList = document.getElementById('routineList');
    if (!routineList) return;

    if (currentRoutine.exercises.length === 0) {
        routineList.innerHTML = '<p style="color: #666;">No exercises in routine yet. Add exercises from the Exercise Library!</p>';
        return;
    }

    routineList.innerHTML = currentRoutine.exercises.map(ex => `
        <div class="routine-item" data-id="${ex.id}" style="padding: 0.75rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${ex.name}</strong>
                <div style="font-size: 0.85rem; color: #666;">${ex.category} • ${ex.equipment}</div>
            </div>
            <button class="btn btn-small btn-remove" data-id="${ex.id}" style="background: #f44336; color: white;">❌ Remove</button>
        </div>
    `).join('');

    routineList.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idToRemove = parseInt(btn.getAttribute('data-id'));
            currentRoutine.exercises = currentRoutine.exercises.filter(ex => ex.id !== idToRemove);
            saveRoutine();
            updateRoutineUI();
            showSuccessMessage('Removed from routine');
        });
    });
}

function saveRoutine() {
    localStorage.setItem('currentRoutine', JSON.stringify(currentRoutine));
    console.log('💾 Routine saved to localStorage');
}

function loadRoutine() {
    const stored = localStorage.getItem('currentRoutine');
    if (stored) {
        currentRoutine = JSON.parse(stored);
        updateRoutineUI();
        console.log(`📋 Loaded routine with ${currentRoutine.exercises.length} exercises`);
    }
}

// ====================
// STATISTICS UPDATE
// ====================

function updateProgressStats() {
    const workouts = loadWorkouts();
    const meals = loadMeals();
    
    // Total workouts
    const totalWorkoutsElement = document.getElementById('totalWorkouts');
    if (totalWorkoutsElement) {
        totalWorkoutsElement.textContent = workouts.length;
    }
    
    // Average calories
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
    
    // Week workouts
    const weekWorkoutsElement = document.getElementById('weekWorkouts');
    if (weekWorkoutsElement) {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
        weekWorkoutsElement.textContent = weekWorkouts.length;
    }
    
    // Current streak
    const currentStreakElement = document.getElementById('currentStreak');
    if (currentStreakElement) {
        const streak = calculateStreak();
        currentStreakElement.textContent = streak;
    }
}

function updateNutritionStats() {
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = getMealsForDate(today);
    const totalCalories = todaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    
    // Update nutrition section
    const nutritionCaloriesElement = document.getElementById('nutritionCalories');
    if (nutritionCaloriesElement) {
        nutritionCaloriesElement.textContent = totalCalories;
    }
    
    const nutritionMealsElement = document.getElementById('nutritionMeals');
    if (nutritionMealsElement) {
        nutritionMealsElement.textContent = todaysMeals.length;
    }
    
    // Update dashboard calories
    const caloriesEatenElement = document.getElementById('caloriesEaten');
    if (caloriesEatenElement) {
        caloriesEatenElement.textContent = totalCalories;
    }
    
    // Update progress bar
    const calorieGoalElement = document.getElementById('calorieGoal');
    const calorieGoal = calorieGoalElement ? parseInt(calorieGoalElement.textContent) : 2000;
    
    const calorieProgressElement = document.getElementById('calorieProgress');
    if (calorieProgressElement) {
        const percentage = Math.min((totalCalories / calorieGoal) * 100, 100);
        calorieProgressElement.style.width = percentage + '%';
    }
}

// ====================
// UTILITY FUNCTIONS
// ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====================
// START APPLICATION
// ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
window.fittracker = {
    exercises,
    currentRoutine,
    loadExercises,
    searchUSDA,
    getSampleFoods,
    openFoodSearchModal,
    closeFoodSearchModal,
    searchFoodAPI
};

console.log('🎯 FitTrack loaded! Access debug tools via: window.fittracker');


//  Hamburger Menu Script

   
       

            // Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.querySelector("menu");
    const navList = document.querySelector("nav-list");

    if (menuButton && navList) {
        menuButton.addEventListener("click", () => {
            navList.classList.toggle("open");
            menuButton.classList.toggle("open");
        });
    }
});
        //    Hamburger Menu Work in Progress

        // Hamburger Menu Toggle
        document.addEventListener('DOMContentLoaded', function() {
            const menu = document.getElementById('menu');
            const navList = document.getElementById('nav-list');
            const navOverlay = document.getElementById('navOverlay');
            const navLinks = document.querySelectorAll('.nav a');

            // Create the middle line span for the hamburger
            const middleLine = document.createElement('span');
            menu.appendChild(middleLine);

            // Toggle menu
            function toggleMenu() {
                menu.classList.toggle('active');
                navList.classList.toggle('active');
                navOverlay.classList.toggle('active');
                
                // Prevent body scroll when menu is open
                if (navList.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }

            // Close menu
            function closeMenu() {
                menu.classList.remove('active');
                navList.classList.remove('active');
                navOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }

            // Event listeners
            menu.addEventListener('click', toggleMenu);
            navOverlay.addEventListener('click', closeMenu);

            // Close menu when clicking nav links
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    closeMenu();
                    
                    // Smooth scroll to section
                    const targetId = this.getAttribute('href').substring(1);
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });

            // Close menu on Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && navList.classList.contains('active')) {
                    closeMenu();
                }
            });
        });
