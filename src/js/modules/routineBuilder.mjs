/**
 * ROUTINE BUILDER MODULE
 * 
 * Manages workout routine creation and management
 * Allows users to create custom workout routines with multiple exercises
 */

import { saveRoutines, loadRoutines, deleteRoutine } from './storage.mjs';

// Generate unique IDs for routines/exercises
const uniqueId = () => Date.now() + Math.floor(Math.random() * 1000);

// Current routine being built
let currentRoutine = {
    name: '',
    description: '',
    exercises: []
};

/**
 * Initialize routine builder (reset current routine)
 */
export function initRoutineBuilder() {
    currentRoutine = {
        name: '',
        description: '',
        exercises: []
    };
}

/**
 * Add exercise to current routine
 * 
 * @param {Object} exercise - Exercise object with id, name, category, equipment
 * @param {Object} details - Exercise details (sets, reps, duration, notes)
 * @returns {Object} Added exercise
 */
export function addExerciseToRoutine(exercise, details = {}) {
    const routineExercise = {
        id: uniqueId(),
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        equipment: exercise.equipment,
        sets: details.sets || 3,
        reps: details.reps || 10,
        duration: details.duration || 0,
        notes: details.notes || ''
    };

    currentRoutine.exercises.push(routineExercise);
    return routineExercise;
}

/**
 * Remove exercise from current routine
 * 
 * @param {number} exerciseId - ID of exercise to remove
 */
export function removeExerciseFromRoutine(exerciseId) {
    currentRoutine.exercises = currentRoutine.exercises.filter(
        ex => ex.id !== exerciseId
    );
}

/**
 * Update exercise details in routine
 * 
 * @param {number} exerciseId - ID of exercise to update
 * @param {Object} updates - Updated details (sets, reps, duration, notes)
 */
export function updateRoutineExercise(exerciseId, updates) {
    const exercise = currentRoutine.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const allowedFields = ['sets', 'reps', 'duration', 'notes'];
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            exercise[key] = updates[key];
        }
    });
}

/**
 * Get current routine (deep copy)
 * 
 * @returns {Object} Current routine
 */
export function getCurrentRoutine() {
    return JSON.parse(JSON.stringify(currentRoutine));
}

/**
 * Set routine name and description
 * 
 * @param {string} name - Routine name
 * @param {string} description - Routine description
 */
export function setRoutineInfo(name, description) {
    currentRoutine.name = name.trim();
    currentRoutine.description = description.trim();
}

/**
 * Save current routine
 * 
 * @returns {Object|boolean} Saved routine or false if invalid
 */
export function saveCurrentRoutine() {
    if (!currentRoutine.name || currentRoutine.exercises.length === 0) return false;

    const routine = {
        id: uniqueId(),
        name: currentRoutine.name,
        description: currentRoutine.description,
        exercises: currentRoutine.exercises,
        createdAt: new Date().toISOString()
    };

    const routines = loadRoutines();
    routines.push(routine);
    saveRoutines(routines);

    initRoutineBuilder(); // Reset after saving

    return routine;
}

/**
 * Load a saved routine for editing
 * 
 * @param {number} routineId - ID of routine to load
 * @returns {Object|null} Loaded routine or null
 */
export function loadRoutineForEditing(routineId) {
    const routines = loadRoutines();
    const routine = routines.find(r => r.id === routineId);

    if (!routine) return null;

    currentRoutine = {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        exercises: [...routine.exercises]
    };

    return getCurrentRoutine();
}

/**
 * Delete a saved routine
 * 
 * @param {number} routineId - ID of routine to delete
 * @returns {boolean} Success status
 */
export function removeRoutine(routineId) {
    return deleteRoutine(routineId);
}

/**
 * Get all saved routines
 * 
 * @returns {Array} Array of routines
 */
export function getAllRoutines() {
    return loadRoutines();
}

/**
 * Reorder exercises in current routine
 * 
 * @param {number} fromIndex - Current index
 * @param {number} toIndex - Target index
 */
export function reorderExercises(fromIndex, toIndex) {
    const exercises = currentRoutine.exercises;
    if (
        fromIndex < 0 || fromIndex >= exercises.length ||
        toIndex < 0 || toIndex >= exercises.length
    ) return;

    const [movedExercise] = exercises.splice(fromIndex, 1);
    exercises.splice(toIndex, 0, movedExercise);
}

/**
 * Duplicate an exercise in the routine
 * 
 * @param {number} exerciseId - ID of exercise to duplicate
 * @returns {Object|null} Duplicate exercise
 */
export function duplicateExercise(exerciseId) {
    const exercise = currentRoutine.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return null;

    const duplicate = { ...exercise, id: uniqueId() };
    currentRoutine.exercises.push(duplicate);
    return duplicate;
}

/**
 * Clear exercises from current routine (keep name/description)
 */
export function clearExercises() {
    currentRoutine.exercises = [];
}

/**
 * Get routine summary statistics
 * 
 * @param {Object} routine - Routine object
 * @returns {Object} Summary stats
 */
export function getRoutineSummary(routine) {
    const totalExercises = routine.exercises.length;
    const totalSets = routine.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
    const totalReps = routine.exercises.reduce((sum, ex) => sum + ((ex.reps || 0) * (ex.sets || 0)), 0);

    const estimatedDuration = routine.exercises.reduce((sum, ex) => {
        const setTime = (ex.sets || 3) * 2.5; // 2-3 mins per set
        return sum + setTime + (ex.duration || 0);
    }, 0);

    const categories = {};
    routine.exercises.forEach(ex => {
        categories[ex.category] = (categories[ex.category] || 0) + 1;
    });

    return {
        totalExercises,
        totalSets,
        totalReps,
        estimatedDuration: Math.round(estimatedDuration),
        categories
    };
}
