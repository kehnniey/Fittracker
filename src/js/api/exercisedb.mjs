/**
 * ExerciseDB API MODULE (RapidAPI)
 */

const EXERCISEDB_URL = "https://exercisedb.p.rapidapi.com";

// Use env variable if available (Vercel, Netlify, etc.)
const API_KEY = window?.ENV_EXERCISEDB_KEY || "72d365dad4msh3227d3112c65433p107c93jsnce68b9b64865";

// Cache keys
const CACHE_KEY = "fittracker_exercises_cache";
const CACHE_TIME_KEY = "fittracker_exercises_timestamp";

// Shared fetch config
const API_HEADERS = {
    "x-rapidapi-key": API_KEY,
    "x-rapidapi-host": "exercisedb.p.rapidapi.com",
};

/**
 * Normalize exercise data structure
 */
function normalize(ex) {
    return {
        id: ex.id,
        name: capitalize(ex.name),
        category: capitalize(ex.bodyPart),
        equipment: capitalize(ex.equipment),
        type: "Strength",
        description: capitalize(ex.target),
        gif: ex.gifUrl,
    };
}

/** Capitalize helper */
function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Fetch all exercises
 */
export async function fetchExercises() {
    try {
        console.log("🏋️ Fetching exercises from ExerciseDB...");

        const response = await fetch(`${EXERCISEDB_URL}/exercises`, {
            method: "GET",
            headers: API_HEADERS
        });

        // Better error handling
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Rate limit reached. Try again later.");
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("API returned invalid data format.");
        }

        const exercises = data.map(normalize);

        console.log(`✅ Loaded ${exercises.length} exercises`);

        cacheExercises(exercises);
        return exercises;

    } catch (error) {
        console.error("❌ ExerciseDB error:", error.message);

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
        const response = await fetch(
            `${EXERCISEDB_URL}/exercises/exercise/${exerciseId}`,
            { method: "GET", headers: API_HEADERS }
        );

        if (!response.ok) {
            throw new Error("Failed to load details");
        }

        return normalize(await response.json());

    } catch (error) {
        console.error("❌ Error fetching exercise details:", error);
        throw error;
    }
}

/**
 * Search exercises (safe + smart)
 */
export function searchExercises(exercises, query) {
    if (!query || typeof query !== "string") return exercises;

    const q = query.toLowerCase().trim();
    if (!q) return exercises;

    return exercises.filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q)
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
    const items = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIME_KEY);

    if (!items || !timestamp) return null;

    const age = Date.now() - Number(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return age < maxAge ? JSON.parse(items) : null;
}

/**
 * Local fallback list
 */
function getFallbackExercises() {
    return [
        normalize({ id: "0001", name: "push-up", bodyPart: "chest", equipment: "body weight", target: "pectorals", gifUrl: "" }),
        normalize({ id: "0002", name: "squat", bodyPart: "legs", equipment: "body weight", target: "quadriceps", gifUrl: "" })
    ];
}
