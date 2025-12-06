// // API Configuration


const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

// IMPORTANT: Replace with your real API key
const USDA_API_KEY = "3CIAqDZEghWgVl3KhB8mUzNaMw2gFQwzcLRqmAZq"; 

/**
 * Detect whether a real API key is set
 */
export function isConfigured() {
  return USDA_API_KEY && USDA_API_KEY !== "DEMO_KEY" && USDA_API_KEY !== "3CIAqDZEghWgVl3KhB8mUzNaMw2gFQwzcLRqmAZq";
}

/**
 * Generic fetch wrapper for USDA API
 */
async function usdaRequest(endpoint, options = {}) {
  const url = `${USDA_API_BASE}${endpoint}?api_key=${USDA_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : null
    });

    if (!response.ok) {
      throw new Error(`USDA API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();

  } catch (err) {
    console.error("USDA Request Failed:", err.message);

    if (!isConfigured()) {
      console.warn("⚠️ Using demo mode fallback samples.");
      return null;
    }

    throw err;
  }
}

/**
 * Search foods
 */
export async function searchFood(query, pageSize = 25) {
  const endpoint = `/foods/search&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;

  const data = await usdaRequest(endpoint);

  if (!data || !data.foods) {
    return getSampleFoods(query);
  }

  return data.foods.map(transformSearchFood);
}

/**
 * Get detailed nutrition by FDC ID
 */
export async function getFoodDetails(fdcId) {
  const endpoint = `/food/${fdcId}`;

  const data = await usdaRequest(endpoint);

  if (!data) throw new Error("Failed to fetch detailed food info.");

  return transformDetailedFood(data);
}

/**
 * Bulk request multiple food items
 */
export async function getMultipleFoods(fdcIds = []) {
  const endpoint = `/foods`;

  const data = await usdaRequest(endpoint, {
    method: "POST",
    body: { fdcIds }
  });

  return (data || []).map(transformDetailedFood);
}

/* -------------------- TRANSFORM HELPERS -------------------- */

function transformSearchFood(food) {
  const n = extractNutrients(food.foodNutrients || []);

  return {
    fdcId: food.fdcId,
    name: food.description || "Unknown",
    calories: n.calories,
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
    brandOwner: food.brandOwner || null,
    servingSize: food.servingSize || 100,
    servingUnit: food.servingSizeUnit || "g",
    dataType: food.dataType,
    source: "usda"
  };
}

function transformDetailedFood(food) {
  const n = extractNutrients(food.foodNutrients || []);

  return {
    fdcId: food.fdcId,
    name: food.description,
    calories: n.calories,
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
    fiber: n.fiber,
    sugar: n.sugar,
    sodium: n.sodium,
    cholesterol: n.cholesterol,
    ingredients: food.ingredients || null,
    brandOwner: food.brandOwner || null,
    servingSize: food.servingSize || 100,
    servingUnit: food.servingSizeUnit || "g",
    householdServingFullText: food.householdServingFullText || null,
    dataType: food.dataType,
    source: "usda"
  };
}

/* -------------------- NUTRIENT EXTRACTION -------------------- */

function extractNutrients(list) {
  const out = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0
  };

  for (const n of list) {
    const id = n.nutrientId;
    const val = Math.round(n.value || 0);

    switch (id) {
      case 1008: out.calories = val; break;     // Energy
      case 1003: out.protein = val; break;
      case 1005: out.carbs = val; break;
      case 1004: out.fat = val; break;
      case 1079: out.fiber = val; break;
      case 2000: out.sugar = val; break;
      case 1093: out.sodium = val; break;
      case 1253: out.cholesterol = val; break;
    }
  }

  return out;
}

/* -------------------- FALLBACK SAMPLE FOODS -------------------- */

export function getSampleFoods(query) {
  console.warn(`Sample foods returned for query: "${query}" (API not configured)`);

  return [
    {
      fdcId: 171705,
      name: "Chicken breast, cooked",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      servingSize: 100,
      servingUnit: "g",
      dataType: "SR Legacy",
      source: "usda"
    },
    {
      fdcId: 168878,
      name: "Rice, brown, cooked",
      calories: 111,
      protein: 3,
      carbs: 23,
      fat: 0.9,
      servingSize: 100,
      servingUnit: "g",
      dataType: "SR Legacy",
      source: "usda"
    }
    // (you can add more sample items here if needed)
  ];
}
