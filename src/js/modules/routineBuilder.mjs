/**
 * ROUTINE BUILDER MODULE
 *
 * Handles creation, editing, saving, and summary statistics
 * for custom workout routines.
 */

import { saveRoutines, loadRoutines, deleteRoutine } from './storage.mjs';

// Current routine being built/edited
let currentRoutine = createEmptyRoutine();

/**
 * Create a new blank routine structure
 */
function createEmptyRoutine() {
    return {
        id: null,
        name: '',
        description: '',
        exercises: []
    };
}

/**
 * Generate a reasonably unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

/**
 * Reset routine builder to a fresh routine
 */
export function initRoutineBuilder() {
    currentRoutine = createEmptyRoutine();
}

/**
 * Add an exercise to the current routine
 *
 * @param {Object} exercise  Exercise object (id, name, category, equipment)
 * @param {Object} details   Sets/reps/duration/notes overrides
 */
export function addExerciseToRoutine(exercise, details = {}) {
    if (!exercise) return null;

    const routineExercise = {
        id: generateId(),
        exerciseId: exercise.id || null,
        name: exercise.name || 'Unnamed Exercise',
        category: exercise.category || 'General',
        equipment: exercise.equipment || 'None',
        sets: Number(details.sets) || 3,
        reps: Number(details.reps) || 10,
        duration: Number(details.duration) || 0,
        notes: details.notes || ''
    };

    currentRoutine.exercises.push(routineExercise);
    return routineExercise;
}

/**
 * Remove an exercise from the current routine
 *
 * @param {string|number} exerciseId - Internal exercise ID
 */
export function removeExerciseFromRoutine(exerciseId) {
    currentRoutine.exercises = currentRoutine.exercises.fi
