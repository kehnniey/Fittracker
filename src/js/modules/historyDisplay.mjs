/**
 * HISTORY DISPLAY MODULE
 * 
 * Displays workout history and routine lists
 */

import { loadWorkouts } from './storage.mjs';
import { loadRoutines } from './storage.mjs';
import { formatDate } from './dashboard.mjs';

/**
 * Display all saved routines
 */
export function displayRoutines() {
    const routinesContainer = document.getElementById('routinesList');
    
    if (!routinesContainer) return;
    
    const routines = loadRoutines();
    
    if (routines.length === 0) {
        routinesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No routines yet. Create your first routine!</p>
            </div>
        `;
        return;
    }
    
    routinesContainer.innerHTML = routines.map(routine => {
        const exerciseCount = routine.exercises.length;
        const totalSets = routine.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
        const estimatedTime = Math.round(totalSets * 2.5); // Estimate 2.5 min per set
        
        return `
            <div class="routine-card" data-routine-id="${routine.id}">
                <div class="routine-card-header">
                    <div>
                        <div class="routine-name">${routine.name}</div>
                        ${routine.description ? `<div class="routine-description">${routine.description}</div>` : ''}
                    </div>
                    <div class="routine-actions">
                        <button class="routine-action-btn" data-action="start" data-routine-id="${routine.id}" title="Start workout">
                            ▶️
                        </button>
                        <button class="routine-action-btn" data-action="edit" data-routine-id="${routine.id}" title="Edit routine">
                            ✏️
                        </button>
                        <button class="routine-action-btn" data-action="delete" data-routine-id="${routine.id}" title="Delete routine">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="routine-stats">
                    <div class="routine-stat">
                        <span class="routine-stat-icon">💪</span>
                        <span>${exerciseCount} exercises</span>
                    </div>
                    <div class="routine-stat">
                        <span class="routine-stat-icon">📊</span>
                        <span>${totalSets} sets</span>
                    </div>
                    <div class="routine-stat">
                        <span class="routine-stat-icon">⏱️</span>
                        <span>~${estimatedTime} min</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click listeners to action buttons
    routinesContainer.querySelectorAll('.routine-action-btn').forEach(btn => {
        btn.addEventListener('click', handleRoutineAction);
    });
    
    // Add click listeners to routine cards
    routinesContainer.querySelectorAll('.routine-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Only trigger if not clicking action buttons
            if (!e.target.closest('.routine-action-btn')) {
                const routineId = parseInt(card.getAttribute('data-routine-id'));
                viewRoutineDetails(routineId);
            }
        });
    });
}

/**
 * Handle routine action button clicks
 */
function handleRoutineAction(e) {
    e.stopPropagation(); // Prevent card click
    
    const action = e.currentTarget.getAttribute('data-action');
    const routineId = parseInt(e.currentTarget.getAttribute('data-routine-id'));
    
    switch (action) {
        case 'start':
            startRoutine(routineId);
            break;
        case 'edit':
            editRoutine(routineId);
            break;
        case 'delete':
            deleteRoutine(routineId);
            break;
    }
}

/**
 * View routine details (placeholder)
 */
function viewRoutineDetails(routineId) {
    const routines = loadRoutines();
    const routine = routines.find(r => r.id === routineId);
    
    if (!routine) return;
    
    // For now, show an alert with routine info
    // In Week 7, we'll open a detailed modal
    const exerciseList = routine.exercises.map(ex => 
        `- ${ex.name} (${ex.sets}×${ex.reps})`
    ).join('\n');
    
    alert(`${routine.name}\n\nExercises:\n${exerciseList}`);
}

/**
 * Start a routine workout
 */
function startRoutine(routineId) {
    const routines = loadRoutines();
    const routine = routines.find(r => r.id === routineId);
    
    if (!routine) return;
    
    // For now, show confirmation
    // In Week 7, we'll implement workout execution mode
    if (confirm(`Start "${routine.name}" workout?\n\nThis will guide you through ${routine.exercises.length} exercises.`)) {
        alert('Workout execution mode coming in Week 7! For now, you can log exercises manually.');
    }
}

/**
 * Edit a routine
 */
function editRoutine(routineId) {
    // This will be connected to routine builder in next update
    alert('Edit routine feature coming soon!');
}

/**
 * Delete a routine
 */
function deleteRoutine(routineId) {
    const routines = loadRoutines();
    const routine = routines.find(r => r.id === routineId);
    
    if (!routine) return;
    
    if (confirm(`Delete routine "${routine.name}"?\n\nThis cannot be undone.`)) {
        const updated = routines.filter(r => r.id !== routineId);
        localStorage.setItem('fittracker_routines', JSON.stringify(updated));
        displayRoutines(); // Refresh display
        
        // Show success toast (if available)
        if (window.showSuccessMessage) {
            window.showSuccessMessage(`Deleted "${routine.name}"`);
        }
    }
}

/**
 * Display workout history
 */
export function displayWorkoutHistory() {
    const historyContainer = document.getElementById('workoutHistory');
    
    if (!historyContainer) return;
    
    const workouts = loadWorkouts();
    
    if (workouts.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No workout history yet. Start logging workouts!</p>
            </div>
        `;
        return;
    }
    
    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workouts].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    // Group by date
    const groupedByDate = {};
    sortedWorkouts.forEach(workout => {
        if (!groupedByDate[workout.date]) {
            groupedByDate[workout.date] = [];
        }
        groupedByDate[workout.date].push(workout);
    });
    
    historyContainer.innerHTML = `
        <div class="history-list">
            ${Object.entries(groupedByDate).map(([date, workouts]) => `
                <div class="history-date-group">
                    <div class="history-date">${formatDate(date)}</div>
                    ${workouts.map(workout => `
                        <div class="history-item">
                            <div class="history-workout-name">${workout.name}</div>
                            <div class="history-details">
                                ${workout.duration} min • ${workout.sets} sets × ${workout.reps} reps
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Refresh all displays
 */
export function refreshDisplays() {
    displayRoutines();
    displayWorkoutHistory();
}