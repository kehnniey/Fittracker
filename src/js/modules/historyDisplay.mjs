/**
 * historyDisplay.mjs
 */
import { loadWorkouts, loadRoutines } from './storage.mjs';
import { formatDate } from './dashboard.mjs';

export function displayRoutines() {
    const container = document.getElementById('routinesList');
    if (!container) return;
    const routines = loadRoutines();
    if (!routines || routines.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><p>No routines yet. Create your first routine!</p></div>`;
        return;
    }
    container.innerHTML = routines.map(routine => {
        const exerciseCount = (routine.exercises || []).length;
        const totalSets = (routine.exercises || []).reduce((s, e) => s + (e.sets || 0), 0);
        const estimatedTime = Math.round(totalSets * 2.5);
        return `
            <div class="routine-card" data-routine-id="${routine.id}">
                <div class="routine-card-header">
                    <div>
                        <div class="routine-name">${routine.name}</div>
                        ${routine.description ? `<div class="routine-description">${routine.description}</div>` : ''}
                    </div>
                    <div class="routine-actions">
                        <button class="routine-action-btn" data-action="start" data-routine-id="${routine.id}" title="Start workout">▶️</button>
                        <button class="routine-action-btn" data-action="edit" data-routine-id="${routine.id}" title="Edit routine">✏️</button>
                        <button class="routine-action-btn" data-action="delete" data-routine-id="${routine.id}" title="Delete routine">🗑️</button>
                    </div>
                </div>
                <div class="routine-stats">
                    <div class="routine-stat"><span class="routine-stat-icon">💪</span><span>${exerciseCount} exercises</span></div>
                    <div class="routine-stat"><span class="routine-stat-icon">📊</span><span>${totalSets} sets</span></div>
                    <div class="routine-stat"><span class="routine-stat-icon">⏱️</span><span>~${estimatedTime} min</span></div>
                </div>
            </div>
        `;
    }).join('');
    container.querySelectorAll('.routine-action-btn').forEach(btn => btn.addEventListener('click', handleRoutineAction));
    container.querySelectorAll('.routine-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.routine-action-btn')) {
                const id = parseInt(card.getAttribute('data-routine-id'));
                viewRoutineDetails(id);
            }
        });
    });
}

function handleRoutineAction(e) {
    e.stopPropagation();
    const action = e.currentTarget.getAttribute('data-action');
    const id = parseInt(e.currentTarget.getAttribute('data-routine-id'));
    if (action === 'start') startRoutine(id);
    if (action === 'edit') editRoutine(id);
    if (action === 'delete') deleteRoutineConfirm(id);
}

function viewRoutineDetails(routineId) {
    const routines = loadRoutines();
    const r = routines.find(x => x.id === routineId);
    if (!r) return;
    const list = (r.exercises || []).map(ex => `- ${ex.name} (${ex.sets || 0}×${ex.reps || 0})`).join('\n');
    alert(`${r.name}\n\nExercises:\n${list}`);
}

function startRoutine(routineId) {
    const routines = loadRoutines();
    const r = routines.find(x => x.id === routineId);
    if (!r) return;
    if (confirm(`Start "${r.name}" workout?\n\nThis will guide you through ${r.exercises.length} exercises.`)) {
        alert('Workout execution mode coming in Week 7.');
    }
}

function editRoutine(routineId) { alert('Edit routine feature coming soon!'); }

function deleteRoutineConfirm(routineId) {
    const routines = loadRoutines();
    const r = routines.find(x => x.id === routineId);
    if (!r) return;
    if (!confirm(`Delete routine "${r.name}"? This cannot be undone.`)) return;
    const updated = routines.filter(x => x.id !== routineId);
    localStorage.setItem('fittracker_routines', JSON.stringify(updated));
    displayRoutines();
    if (window.showSuccessMessage) window.showSuccessMessage(`Deleted "${r.name}"`);
}

export function displayWorkoutHistory() {
    const container = document.getElementById('workoutHistory');
    if (!container) return;
    const workouts = loadWorkouts();
    if (!workouts || workouts.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><p>No workout history yet. Start logging workouts!</p></div>`;
        return;
    }
    const sorted = [...workouts].sort((a,b)=> new Date(b.date) - new Date(a.date));
    const grouped = {};
    sorted.forEach(w => { grouped[w.date] = grouped[w.date] || []; grouped[w.date].push(w); });
    container.innerHTML = `<div class="history-list">${Object.entries(grouped).map(([date, items]) => `
        <div class="history-date-group">
            <div class="history-date">${formatDate(date)}</div>
            ${items.map(it => `<div class="history-item">
                <div class="history-workout-name">${it.name}</div>
                <div class="history-details">${it.duration || 0} min • ${it.sets || 0} sets × ${it.reps || 0} reps</div>
            </div>`).join('')}
        </div>`).join('')}</div>`;
}

export function refreshDisplays() {
    displayRoutines();
    displayWorkoutHistory();
}
