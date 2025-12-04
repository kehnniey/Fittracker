/**
 * ROUTINE BUILDER MODULE
 * 
 * Manages workout routine creation and management
 * Allows users to create custom workout routines with multiple exercises
 */

import { saveRoutines, loadRoutines, deleteRoutine } from './storage.mjs';

// Current routine being built
let currentRoutine = {
    name: '',
    description: '',
    exercises: []
};

/**
 * Initialize routine builder
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
 * @param {Object} details - Exercise details (sets, reps, duration)
 */
export function addExerciseToRoutine(exercise, details = {}) {
    const routineExercise = {
        id: Date.now(),
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
 * @param {Object} updates - Updated details
 */
export function updateRoutineExercise(exerciseId, updates) {
    const exercise = currentRoutine.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
        Object.assign(exercise, updates);
    }
}

/**
 * Get current routine
 * 
 * @returns {Object} Current routine being built
 */
export function getCurrentRoutine() {
    return { ...currentRoutine };
}

/**
 * Set routine name and description
 * 
 * @param {string} name - Routine name
 * @param {string} description - Routine description
 */
export function setRoutineInfo(name, description) {
    currentRoutine.name = name;
    currentRoutine.description = description;
}

/**
 * Save current routine
 * 
 * @returns {boolean} Success status
 */
export function saveCurrentRoutine() {
    if (!currentRoutine.name || currentRoutine.name.trim() === '') {
        return false;
    }
    
    if (currentRoutine.exercises.length === 0) {
        return false;
    }
    
    const routine = {
        id: Date.now(),
        name: currentRoutine.name.trim(),
        description: currentRoutine.description.trim(),
        exercises: currentRoutine.exercises,
        createdAt: new Date().toISOString()
    };
    
    const routines = loadRoutines();
    routines.push(routine);
    saveRoutines(routines);
    
    // Reset current routine
    initRoutineBuilder();
    
    return true;
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
    
    if (routine) {
        currentRoutine = {
            id: routine.id,
            name: routine.name,
            description: routine.description,
            exercises: [...routine.exercises]
        };
        return getCurrentRoutine();
    }
    
    return null;
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
 * @returns {Array} Array of saved routines
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
    const [movedExercise] = exercises.splice(fromIndex, 1);
    exercises.splice(toIndex, 0, movedExercise);
}

/**
 * Duplicate an exercise in the routine
 * 
 * @param {number} exerciseId - ID of exercise to duplicate
 */
export function duplicateExercise(exerciseId) {
    const exercise = currentRoutine.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
        const duplicate = {
            ...exercise,
            id: Date.now()
        };
        currentRoutine.exercises.push(duplicate);
        return duplicate;
    }
    return null;
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
    const estimatedDuration = routine.exercises.reduce((sum, ex) => {
        // Estimate 2-3 minutes per set
        const setTime = (ex.sets || 3) * 2.5;
        return sum + setTime + (ex.duration || 0);
    }, 0);
    
    // Count exercises by category
    const categories = {};
    routine.exercises.forEach(ex => {
        categories[ex.category] = (categories[ex.category] || 0) + 1;
    });
    
    return {
        totalExercises,
        totalSets,
        estimatedDuration: Math.round(estimatedDuration),
        categories
    };
}