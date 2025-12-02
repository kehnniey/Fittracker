/**
 * ExerciseDB API MODULE (RapidAPI)
 */

const EXERCISEDB_URL = "https://exercisedb.p.rapidapi.com";
const API_KEY = "72d365dad4msh3227d3112c65433p107c93jsnce68b9b64865";

// Cache keys
const CACHE_KEY = "fittracker_exercises_cache";
const CACHE_TIME_KEY = "fittracker_exercises_timestamp";

/**
 * Fetch all exercises
 */
export async function fetchExercises() {
    try {
        console.log("🏋️ Fetching exercises from ExerciseDB...");

        const response = await fetch(`${EXERCISEDB_URL}/exercises`, {
            method: "GET",
            headers: {
                "x-rapidapi-key": API_KEY,
                "x-rapidapi-host": "exercisedb.p.rapidapi.com"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        console.log(`✅ Loaded ${data.length} exercises from ExerciseDB`);

        // Transform to match your expected format
        const exercises = data.map(ex => ({
            id: ex.id,
            name: ex.name,
            category: ex.bodyPart,
            equipment: ex.equipment,
            type: "Strength",
            description: ex.target,
            gif: ex.gifUrl
        }));

        cacheExercises(exercises);
        return exercises;

    } catch (error) {
        console.error("❌ Error fetching ExerciseDB:", error);

        const cached = getCachedExercises();
        if (cached) {
            console.log("📦 Using cached exercises");
            return cached;
        }

        console.log("⚠️ Using fallback exercises");
        return getFallbackExercises();
    }
}

/**
 * Fetch single exercise by ID
 */
export async function getExerciseDetails(exerciseId) {
    try {
        const response = await fetch(`${EXERCISEDB_URL}/exercises/exercise/${exerciseId}`, {
            method: "GET",
            headers: {
                "x-rapidapi-key": API_KEY,
                "x-rapidapi-host": "exercisedb.p.rapidapi.com"
            }
        });

        if (!response.ok) throw new Error("Failed to load details");

        return await response.json();

    } catch (error) {
        console.error("❌ Error fetching exercise details:", error);
        throw error;
    }
}

/**
 * Simple search function
 */
export function searchExercises(exercises, query) {
    const q = query.toLowerCase().trim();
    if (!q) return exercises;

    return exercises.filter(ex => 
        ex.name.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q)
    );
}

/**
 * Cache helpers
 */
function cacheExercises(exercises) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(exercises));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
}

function getCachedExercises() {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIME_KEY);
    if (!cached || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000;

    return age < maxAge ? JSON.parse(cached) : null;
}

/**
 * Local fallback list
 */
function getFallbackExercises() {
    return [
        { id: "0001", name: "push-up", category: "chest", equipment: "body weight", description: "pectorals", type: "Strength" },
        { id: "0002", name: "squat", category: "legs", equipment: "body weight", description: "quadriceps", type: "Strength" }
    ];
}
