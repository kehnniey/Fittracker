/**
 * WGER API MODULE (COMPLETE & FIXED)
 * 
 * This module handles all interactions with the Wger Exercise API
 * Wger is a free, open-source workout management application
 * API Documentation: https://wger.de/en/software/api
 * 
 * Features:
 * - Fetches exercises with proper equipment and category names
 * - Loads equipment and category data from API
 * - Caches exercises in localStorage
 * - Provides fallback data if API is unavailable
 */

// API Configuration
const WGER_API_BASE = 'https://wger.de/api/v2';
const WGER_API_KEY = '3CIAqDZEghWgVl3KhB8mUzNaMw2gFQwzcLRqmAZq';

// Storage keys for caching
const CACHE_KEY = 'fittracker_exercises';
const CACHE_TIME_KEY = 'fittracker_exercises_timestamp';

// Maps to store equipment and category names
let equipmentMap = {};
let categoryMap = {};

/**
 * Load equipment names from Wger API
 * Creates a map of equipment IDs to names
 */
async function loadEquipment() {
    try {
        const url = `${WGER_API_BASE}/equipment/?limit=200`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Build equipment map
        data.results.forEach(eq => {
            equipmentMap[eq.id] = eq.name;
        });
        
        console.log('Loaded equipment:', Object.keys(equipmentMap).length, 'items');
    } catch (error) {
        console.error('Error loading equipment:', error);
        // Use default equipment names
        equipmentMap = {
            1: 'Barbell',
            3: 'Dumbbell',
            4: 'Gym mat',
            6: 'Pull-up bar',
            7: 'None (bodyweight)',
            8: 'Bench',
            9: 'Incline bench',
            10: 'Kettlebell'
        };
    }
}

/**
 * Load category names from Wger API
 * Creates a map of category IDs to names
 */
async function loadCategories() {
    try {
        const url = `${WGER_API_BASE}/exercisecategory/?limit=200`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Build category map
        data.results.forEach(cat => {
            categoryMap[cat.id] = cat.name;
        });
        
        console.log('Loaded categories:', Object.keys(categoryMap).length, 'items');
    } catch (error) {
        console.error('Error loading categories:', error);
        // Use default category names
        categoryMap = {
            10: 'Abs',
            8: 'Arms',
            12: 'Back',
            14: 'Calves',
            11: 'Chest',
            9: 'Legs',
            13: 'Shoulders',
            7: 'Core'
        };
    }
}

/**
 * Fetch exercises from Wger API
 * 
 * @param {number} limit - Number of exercises to fetch (default: 50)
 * @param {number} language - Language ID (2 = English)
 * @returns {Promise<Array>} Array of exercise objects
 */
export async function fetchExercises(limit = 50, language = 2) {
    try {
        // Load equipment and categories FIRST (parallel loading)
        await Promise.all([loadEquipment(), loadCategories()]);
        
        // Construct the API URL
        const url = `${WGER_API_BASE}/exercise/?language=${language}&limit=${limit}`;
        
        console.log('Fetching exercises from Wger API...');
        
        // Make the fetch request with authentication
        const response = await fetch(url, {
            method: 'GET',
            headers: WGER_API_KEY ? {
                'Authorization': `Token ${WGER_API_KEY}`,
                'Content-Type': 'application/json'
            } : {}
        });
        
        // Check if request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse JSON response
        const data = await response.json();
        
        console.log(`Successfully fetched ${data.results.length} exercises from API`);
        console.log('Sample exercise:', data.results[0]); // Debug log
        
        // Transform API data to our app's format
        const exercises = transformExercises(data.results);
        
        console.log(`Transformed to ${exercises.length} valid exercises`);
        
        // Cache exercises in localStorage for offline use
        cacheExercises(exercises);
        
        return exercises;
        
    } catch (error) {
        console.error('Error fetching from Wger API:', error);
        
        // Try to load from cache
        const cachedExercises = getCachedExercises();
        if (cachedExercises) {
            console.log('Using cached exercises');
            return cachedExercises;
        }
        
        // If no cache available, return fallback data
        console.log('Using fallback exercise data');
        return getFallbackExercises();
    }
}

/**
 * Transform Wger API response to our app's format
 * 
 * @param {Array} apiExercises - Raw exercise data from API
 * @returns {Array} Transformed exercise objects
 */
function transformExercises(apiExercises) {
    return apiExercises.map(exercise => {
        // Safely get exercise name
        const name = typeof exercise.name === 'string' && exercise.name.trim() !== ''
            ? exercise.name.trim()
            : 'Unnamed Exercise';
        
        // Get category name from map
        const category = exercise.category && categoryMap[exercise.category]
            ? categoryMap[exercise.category]
            : 'General';
        
        // Get equipment name from map (first equipment if array)
        let equipment = 'Bodyweight';
        if (exercise.equipment && Array.isArray(exercise.equipment) && exercise.equipment.length > 0) {
            const equipmentId = exercise.equipment[0];
            equipment = equipmentMap[equipmentId] || 'Equipment';
        }
        
        return {
            id: exercise.id,
            name: name,
            category: category,
            equipment: equipment,
            description: exercise.description || '',
            type: 'Strength' // Default type
        };
    });
}

/**
 * Cache exercises in localStorage
 * 
 * @param {Array} exercises - Exercise data to cache
 */
function cacheExercises(exercises) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(exercises));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        console.log('Exercises cached successfully');
    } catch (error) {
        console.error('Error caching exercises:', error);
    }
}

/**
 * Get cached exercises from localStorage
 * 
 * @returns {Array|null} Cached exercises or null if not available
 */
function getCachedExercises() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIME_KEY);
        
        if (!cached || !timestamp) {
            return null;
        }
        
        // Check if cache is older than 24 hours (86400000 ms)
        const age = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age > maxAge) {
            console.log('Cache expired');
            return null;
        }
        
        return JSON.parse(cached);
    } catch (error) {
        console.error('Error reading cached exercises:', error);
        return null;
    }
}

/**
 * Fallback exercise data when API is unavailable
 * This ensures the app still works offline
 * 
 * @returns {Array} Array of sample exercises
 */
function getFallbackExercises() {
    return [
        { 
            id: 1, 
            name: 'Bench Press', 
            category: 'Chest', 
            equipment: 'Barbell', 
            type: 'Strength',
            description: 'Classic chest exercise performed lying on a bench'
        },
        { 
            id: 2, 
            name: 'Squats', 
            category: 'Legs', 
            equipment: 'Barbell', 
            type: 'Strength',
            description: 'Fundamental lower body compound movement'
        },
        { 
            id: 3, 
            name: 'Deadlift', 
            category: 'Back', 
            equipment: 'Barbell', 
            type: 'Strength',
            description: 'Full body compound exercise targeting posterior chain'
        },
        { 
            id: 4, 
            name: 'Pull-ups', 
            category: 'Back', 
            equipment: 'Bodyweight', 
            type: 'Strength',
            description: 'Upper body pulling exercise using bodyweight'
        },
        { 
            id: 5, 
            name: 'Push-ups', 
            category: 'Chest', 
            equipment: 'Bodyweight', 
            type: 'Strength',
            description: 'Fundamental bodyweight chest exercise'
        },
        { 
            id: 6, 
            name: 'Shoulder Press', 
            category: 'Shoulders', 
            equipment: 'Dumbbell', 
            type: 'Strength',
            description: 'Overhead pressing movement for shoulders'
        },
        { 
            id: 7, 
            name: 'Bicep Curls', 
            category: 'Arms', 
            equipment: 'Dumbbell', 
            type: 'Strength',
            description: 'Isolation exercise for biceps'
        },
        { 
            id: 8, 
            name: 'Tricep Dips', 
            category: 'Arms', 
            equipment: 'Bodyweight', 
            type: 'Strength',
            description: 'Bodyweight exercise targeting triceps'
        },
        { 
            id: 9, 
            name: 'Lunges', 
            category: 'Legs', 
            equipment: 'Bodyweight', 
            type: 'Strength',
            description: 'Unilateral leg exercise for balance and strength'
        },
        { 
            id: 10, 
            name: 'Plank', 
            category: 'Core', 
            equipment: 'Bodyweight', 
            type: 'Core',
            description: 'Isometric core strengthening exercise'
        },
        { 
            id: 11, 
            name: 'Running', 
            category: 'Cardio', 
            equipment: 'None', 
            type: 'Cardio',
            description: 'Cardiovascular endurance exercise'
        },
        { 
            id: 12, 
            name: 'Cycling', 
            category: 'Cardio', 
            equipment: 'Bike', 
            type: 'Cardio',
            description: 'Low-impact cardiovascular exercise'
        }
    ];
}

/**
 * Search exercises by query string
 * 
 * @param {Array} exercises - Array of exercises to search
 * @param {string} query - Search query
 * @returns {Array} Filtered exercises
 */
export function searchExercises(exercises, query) {
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
        return exercises;
    }
    
    return exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(lowerQuery) ||
        exercise.category.toLowerCase().includes(lowerQuery) ||
        exercise.equipment.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Fetch workout routines from Wger API
 * Requires authentication token
 * 
 * @returns {Promise<Array>} Array of routine objects
 */
export async function fetchRoutines() {
    try {
        const url = `${WGER_API_BASE}/routine/`;
        
        console.log('Fetching routines from Wger API...');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${WGER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log(`Successfully fetched ${data.results ? data.results.length : 0} routines`);
        
        return data.results || [];
        
    } catch (error) {
        console.error('Error fetching routines:', error);
        return [];
    }
}

/**
 * Get detailed information about a specific exercise
 * 
 * @param {number} exerciseId - Exercise ID
 * @returns {Promise<Object>} Detailed exercise information
 */
export async function getExerciseDetails(exerciseId) {
    try {
        const url = `${WGER_API_BASE}/exercise/${exerciseId}/`;
        
        console.log('Fetching exercise details for ID:', exerciseId);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${WGER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const exercise = await response.json();
        
        return exercise;
        
    } catch (error) {
        console.error('Error fetching exercise details:', error);
        throw error;
    }
}