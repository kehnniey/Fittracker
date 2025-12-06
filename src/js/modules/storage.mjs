/**
 * storage.mjs
 * LocalStorage helpers + app data management
 */

const STORAGE_PREFIX = 'fittracker_';

function isStorageAvailable() {
    try {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        console.warn('localStorage not available:', e && e.message);
        return false;
    }
}

export function saveData(key, data) {
    if (!isStorageAvailable()) return false;
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
        return true;
    } catch (err) {
        console.error('saveData error', err);
        return false;
    }
}

export function loadData(key, defaultValue = null) {
    if (!isStorageAvailable()) return defaultValue;
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw === null || raw === 'undefined') return defaultValue;
        const parsed = JSON.parse(raw);
        return parsed ?? defaultValue;
    } catch (err) {
        console.error('loadData error', err);
        return defaultValue;
    }
}

export function deleteData(key) {
    if (!isStorageAvailable()) return false;
    try {
        localStorage.removeItem(STORAGE_PREFIX + key);
        return true;
    } catch (err) {
        console.error('deleteData error', err);
        return false;
    }
}

export function clearAllData() {
    if (!isStorageAvailable()) return false;
    try {
        Object.keys(localStorage)
            .filter(k => k.startsWith(STORAGE_PREFIX))
            .forEach(k => localStorage.removeItem(k));
        return true;
    } catch (err) {
        console.error('clearAllData error', err);
        return false;
    }
}

/* Meals */
export function saveMeals(meals) { return saveData('meals', meals); }
export function loadMeals() { return loadData('meals', []); }
export function addMeal(meal) {
    const meals = loadMeals();
    meal.id = Date.now();
    meal.date = new Date().toISOString().split('T')[0];
    meals.push(meal);
    return saveMeals(meals);
}
export function getMealsForDate(date) {
    const meals = loadMeals();
    return meals.filter(m => m.date === date);
}
export function getTodaysMeals() {
    const today = new Date().toISOString().split('T')[0];
    return getMealsForDate(today);
}
export function getCaloriesForDate(date) {
    return getMealsForDate(date).reduce((s, m) => s + (m.calories || 0), 0);
}

/* Workouts */
export function saveWorkouts(workouts) { return saveData('workouts', workouts); }
export function loadWorkouts() { return loadData('workouts', []); }
export function addWorkout(workout) {
    const workouts = loadWorkouts();
    workout.id = Date.now();
    workout.date = new Date().toISOString().split('T')[0];
    workouts.push(workout);
    return saveWorkouts(workouts);
}
export function getWorkoutsForDate(date) {
    const workouts = loadWorkouts();
    return workouts.filter(w => w.date === date);
}
export function getTodaysWorkouts() {
    const today = new Date().toISOString().split('T')[0];
    return getWorkoutsForDate(today);
}
export function getRecentWorkouts(days = 7) {
    const workouts = loadWorkouts();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return workouts.filter(w => w.date >= cutoffStr);
}
export function calculateStreak() {
    const workouts = loadWorkouts();
    const uniqueDates = [...new Set(workouts.map(w => w.date))].sort().reverse();
    if (uniqueDates.length === 0) return 0;
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; ; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const s = d.toISOString().split('T')[0];
        if (uniqueDates.includes(s)) streak++; else break;
    }
    return streak;
}

/* Routines */
export function saveRoutines(routines) { return saveData('routines', routines); }
export function loadRoutines() { return loadData('routines', []); }
export function addRoutine(routine) {
    const routines = loadRoutines();
    routine.id = Date.now();
    routine.createdAt = new Date().toISOString();
    routines.push(routine);
    return saveRoutines(routines);
}
export function deleteRoutine(routineId) {
    const routines = loadRoutines();
    const filtered = routines.filter(r => r.id !== routineId);
    return saveRoutines(filtered);
}

/* Settings */
export function saveSettings(settings) { return saveData('settings', settings); }
export function loadSettings() {
    const defaults = { calorieGoal: 2000, weightUnit: 'lbs', theme: 'light', notifications: true };
    const saved = loadData('settings', {});
    return { ...defaults, ...saved };
}
export function updateSetting(key, value) {
    const s = loadSettings();
    s[key] = value;
    return saveSettings(s);
}
