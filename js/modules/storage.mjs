/**
 * LOCALSTORAGE MODULE
 * 
 * This module manages all data persistence using browser's localStorage
 * localStorage allows data to persist between browser sessions
 * 
 * Storage Keys:
 * - fittracker_meals: User's meal logs
 * - fittracker_workouts: User's workout logs
 * - fittracker_routines: Custom workout routines
 * - fittracker_settings: User preferences
 */

// Storage key prefixes
const STORAGE_PREFIX = 'fittracker_';

/**
 * Check if localStorage is available
 * Returns false in private browsing, SSR, or unsupported browsers
 * 
 * @returns {boolean} True if localStorage is available
 */
function isStorageAvailable() {
    try {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return false;
        }
        
        // Test if we can actually write to localStorage
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        // localStorage is not available (private mode, quota exceeded, etc.)
        console.warn('localStorage is not available:', e.message);
        return false;
    }
}

/**
 * Save data to localStorage
 * 
 * @param {string} key - Storage key (without prefix)
 * @param {*} data - Data to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export function saveData(key, data) {
    if (!isStorageAvailable()) {
        console.warn('Cannot save data: localStorage not available');
        return false;
    }
    
    try {
        const fullKey = STORAGE_PREFIX + key;
        const jsonData = JSON.stringify(data);
        localStorage.setItem(fullKey, jsonData);
        console.log(`Saved ${key} to localStorage`);
        return true;
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
        // localStorage can fail if quota exceeded or in private browsing
        if (error.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded. Try clearing old data.');
        }
        return false;
    }
}

/**
 * Load data from localStorage
 * 
 * @param {string} key - Storage key (without prefix)
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed data or default value
 */
export function loadData(key, defaultValue = null) {
    if (!isStorageAvailable()) {
        return defaultValue;
    }
    
    try {
        const fullKey = STORAGE_PREFIX + key;
        const jsonData = localStorage.getItem(fullKey);
        
        if (jsonData === null || jsonData === 'undefined') {
            return defaultValue;
        }
        
        const parsed = JSON.parse(jsonData);
        return parsed !== null ? parsed : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Delete data from localStorage
 * 
 * @param {string} key - Storage key (without prefix)
 * @returns {boolean} Success status
 */
export function deleteData(key) {
    if (!isStorageAvailable()) {
        return false;
    }
    
    try {
        const fullKey = STORAGE_PREFIX + key;
        localStorage.removeItem(fullKey);
        console.log(`Deleted ${key} from localStorage`);
        return true;
    } catch (error) {
        console.error(`Error deleting ${key}:`, error);
        return false;
    }
}

/**
 * Clear all app data from localStorage
 * Useful for reset/logout functionality
 * 
 * @returns {boolean} Success status
 */
export function clearAllData() {
    if (!isStorageAvailable()) {
        return false;
    }
    
    try {
        // Get all keys that start with our prefix
        const keys = Object.keys(localStorage);
        const appKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
        
        // Remove each key
        appKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log(`Cleared ${appKeys.length} items from localStorage`);
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
    }
}

// ====================
// MEALS MANAGEMENT
// ====================

/**
 * Save meals array to storage
 * 
 * @param {Array} meals - Array of meal objects
 */
export function saveMeals(meals) {
    return saveData('meals', meals);
}

/**
 * Load meals array from storage
 * 
 * @returns {Array} Array of meal objects
 */
export function loadMeals() {
    return loadData('meals', []);
}

/**
 * Add a single meal
 * 
 * @param {Object} meal - Meal object to add
 * @returns {boolean} Success status
 */
export function addMeal(meal) {
    const meals = loadMeals();
    meal.id = Date.now(); // Add unique ID
    meal.date = new Date().toISOString().split('T')[0]; // Add current date
    meals.push(meal);
    return saveMeals(meals);
}

/**
 * Get meals for a specific date
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Meals for that date
 */
export function getMealsForDate(date) {
    const meals = loadMeals();
    return meals.filter(meal => meal.date === date);
}

/**
 * Get today's meals
 * 
 * @returns {Array} Today's meals
 */
export function getTodaysMeals() {
    const today = new Date().toISOString().split('T')[0];
    return getMealsForDate(today);
}

/**
 * Calculate total calories for a date
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {number} Total calories
 */
export function getCaloriesForDate(date) {
    const meals = getMealsForDate(date);
    return meals.reduce((total, meal) => total + (meal.calories || 0), 0);
}

// ====================
// WORKOUTS MANAGEMENT
// ====================

/**
 * Save workouts array to storage
 * 
 * @param {Array} workouts - Array of workout objects
 */
export function saveWorkouts(workouts) {
    return saveData('workouts', workouts);
}

/**
 * Load workouts array from storage
 * 
 * @returns {Array} Array of workout objects
 */
export function loadWorkouts() {
    return loadData('workouts', []);
}

/**
 * Add a single workout
 * 
 * @param {Object} workout - Workout object to add
 * @returns {boolean} Success status
 */
export function addWorkout(workout) {
    const workouts = loadWorkouts();
    workout.id = Date.now(); // Add unique ID
    workout.date = new Date().toISOString().split('T')[0]; // Add current date
    workouts.push(workout);
    return saveWorkouts(workouts);
}

/**
 * Get workouts for a specific date
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Workouts for that date
 */
export function getWorkoutsForDate(date) {
    const workouts = loadWorkouts();
    return workouts.filter(workout => workout.date === date);
}

/**
 * Get today's workouts
 * 
 * @returns {Array} Today's workouts
 */
export function getTodaysWorkouts() {
    const today = new Date().toISOString().split('T')[0];
    return getWorkoutsForDate(today);
}

/**
 * Get workouts for the past N days
 * 
 * @param {number} days - Number of days to look back
 * @returns {Array} Workouts within date range
 */
export function getRecentWorkouts(days = 7) {
    const workouts = loadWorkouts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split('T')[0];
    
    return workouts.filter(workout => workout.date >= cutoffString);
}

/**
 * Calculate current workout streak
 * A streak is consecutive days with at least one workout
 * 
 * @returns {number} Current streak in days
 */
export function calculateStreak() {
    const workouts = loadWorkouts();
    
    if (!workouts || workouts.length === 0) {
        return 0;
    }
    
    try {
        // Get unique workout dates, sorted newest first
        const uniqueDates = [...new Set(workouts.map(w => w.date))].sort().reverse();
        
        if (uniqueDates.length === 0) {
            return 0;
        }
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check each consecutive day going backwards
        for (let i = 0; i < uniqueDates.length; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateString = checkDate.toISOString().split('T')[0];
            
            if (uniqueDates.includes(dateString)) {
                streak++;
            } else {
                // Streak is broken
                break;
            }
        }
        
        return streak;
    } catch (error) {
        console.error('Error calculating streak:', error);
        return 0;
    }
}

// ====================
// ROUTINES MANAGEMENT
// ====================

/**
 * Save workout routines
 * 
 * @param {Array} routines - Array of routine objects
 */
export function saveRoutines(routines) {
    return saveData('routines', routines);
}

/**
 * Load workout routines
 * 
 * @returns {Array} Array of routine objects
 */
export function loadRoutines() {
    return loadData('routines', []);
}

/**
 * Add a new routine
 * 
 * @param {Object} routine - Routine object with name and exercises
 * @returns {boolean} Success status
 */
export function addRoutine(routine) {
    const routines = loadRoutines();
    routine.id = Date.now();
    routine.createdAt = new Date().toISOString();
    routines.push(routine);
    return saveRoutines(routines);
}

/**
 * Delete a routine by ID
 * 
 * @param {number} routineId - ID of routine to delete
 * @returns {boolean} Success status
 */
export function deleteRoutine(routineId) {
    const routines = loadRoutines();
    const filtered = routines.filter(r => r.id !== routineId);
    return saveRoutines(filtered);
}

// ====================
// SETTINGS MANAGEMENT
// ====================

/**
 * Save user settings
 * 
 * @param {Object} settings - Settings object
 */
export function saveSettings(settings) {
    return saveData('settings', settings);
}

/**
 * Load user settings
 * 
 * @returns {Object} Settings object with defaults
 */
export function loadSettings() {
    const defaults = {
        calorieGoal: 2000,
        weightUnit: 'lbs',
        theme: 'light',
        notifications: true
    };
    
    const saved = loadData('settings', {});
    return { ...defaults, ...saved };
}

/**
 * Update a specific setting
 * 
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 * @returns {boolean} Success status
 */
export function updateSetting(key, value) {
    const settings = loadSettings();
    settings[key] = value;
    return saveSettings(settings);
}