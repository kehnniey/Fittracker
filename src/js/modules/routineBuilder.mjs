/**
 * routineBuilder.mjs
 */

import { saveRoutines, loadRoutines, deleteRoutine } from './storage.mjs';

const uniqueId = () => Date.now() + Math.floor(Math.random() * 1000);

let currentRoutine = {
    name: '',
    description: '',
    exercises: []
};

// -----------------------------
// INIT
// -----------------------------
export function initRoutineBuilder() {
    currentRoutine = { name: '', description: '', exercises: [] };
}

// -----------------------------
// ADD EXERCISE
// -----------------------------
export function addExerciseToRoutine(exercise, details = {}) {
    if (!exercise || !exercise.id) {
        console.warn("addExerciseToRoutine: invalid exercise", exercise);
        return null;
    }

    const routineExercise = {
        id: uniqueId(),
        exerciseId: exercise.id,
        name: exercise.name || '',
        category: exercise.category || 'Unknown',
        equipment: exercise.equipment || 'None',
        sets: Number(details.sets) || 3,
        reps: Number(details.reps) || 10,
        duration: Number(details.duration) || 0,
        notes: details.notes || ''
    };

    currentRoutine.exercises.push(routineExercise);
    return routineExercise;
}

// -----------------------------
// REMOVE EXERCISE
// -----------------------------
export function removeExerciseFromRoutine(exerciseId) {
    currentRoutine.exercises = currentRoutine.exercises.filter(
        ex => ex.id !== exerciseId
    );
}

// -----------------------------
// UPDATE EXERCISE
// -----------------------------
export function updateRoutineExercise(exerciseId, updates) {
    const ex = currentRoutine.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    ['sets', 'reps', 'duration', 'notes'].forEach(k => {
        if (updates[k] !== undefined) ex[k] = updates[k];
    });
}

// -----------------------------
// ROUTINE GETTERS / SETTERS
// -----------------------------
export function getCurrentRoutine() {
    return JSON.parse(JSON.stringify(currentRoutine)); // deep clone
}

export function setRoutineInfo(name, description) {
    currentRoutine.name = (name || '').trim();
    currentRoutine.description = (description || '').trim();
}

// -----------------------------
// SAVE ROUTINE
// -----------------------------
export function saveCurrentRoutine() {
    if (!currentRoutine.name || currentRoutine.exercises.length === 0) {
        console.warn("saveCurrentRoutine failed: missing name or exercises");
        return false;
    }

    const routines = loadRoutines();

    const routine = {
        id: uniqueId(),
        name: currentRoutine.name,
        description: currentRoutine.description,
        exercises: currentRoutine.exercises,
        createdAt: new Date().toISOString()
    };

    routines.push(routine);
    saveRoutines(routines);

    initRoutineBuilder();
    return routine;
}

// -----------------------------
// LOAD FOR EDITING
// -----------------------------
export function loadRoutineForEditing(routineId) {
    const routines = loadRoutines();
    const routine = routines.find(r => r.id === routineId);

    if (!routine) {
        console.warn("loadRoutineForEditing: routine not found", routineId);
        return null;
    }

    currentRoutine = {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        exercises: [...routine.exercises]
    };

    return getCurrentRoutine();
}

// -----------------------------
// DELETE
// -----------------------------
export function removeRoutine(routineId) {
    return deleteRoutine(routineId);
}

// -----------------------------
// GET ALL ROUTINES
// -----------------------------
export function getAllRoutines() {
    return loadRoutines();
}

// -----------------------------
// REORDER
// -----------------------------
export function reorderExercises(fromIndex, toIndex) {
    const arr = currentRoutine.exercises;

    if (
        fromIndex < 0 || fromIndex >= arr.length ||
        toIndex < 0 || toIndex > arr.length
    ) return;

    const [item] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, item);
}

// -----------------------------
// DUPLICATE
// -----------------------------
export function duplicateExercise(exerciseId) {
    const ex = currentRoutine.exercises.find(e => e.id === exerciseId);
    if (!ex) return null;

    const dup = { ...ex, id: uniqueId() };
    currentRoutine.exercises.push(dup);

    return dup;
}

// -----------------------------
// CLEAR
// -----------------------------
export function clearExercises() {
    currentRoutine.exercises = [];
}

// -----------------------------
// SUMMARY
// -----------------------------
export function getRoutineSummary(routine) {
    const totalExercises = routine.exercises.length;
    const totalSets = routine.exercises.reduce(
        (s, e) => s + (e.sets || 0),
        0
    );
    const totalReps = routine.exercises.reduce(
        (s, e) => s + ((e.reps || 0) * (e.sets || 0)),
        0
    );

    const estimatedDuration = Math.round(
        routine.exercises.reduce(
            (s, e) => s + ((e.sets || 3) * 2.5) + (e.duration || 0),
            0
        )
    );

    const categories = {};
    routine.exercises.forEach(ex => {
        categories[ex.category] = (categories[ex.category] || 0) + 1;
    });

    return { totalExercises, totalSets, totalReps, estimatedDuration, categories };
}
