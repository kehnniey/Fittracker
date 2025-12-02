// // API Configuration
// const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

// // API Key - Replace with your actual key from https://fdc.nal.usda.gov/api-key-signup.html
// // Current status: Using DEMO_KEY (Replace with your personal key for 1,000 requests/hour)
// const USDA_API_KEY = '3CIAqDZEghWgVl3KhB8mUzNaMw2gFQwzcLRqmAZq';

// // Account Details (for reference)
// const ACCOUNT_INFO = {
//     email: 'kojo1@byupathway.edu',
//     accountId: '05b48b69-4ed2-4039-8883-9bd37a8696fe'
// };

// /**
//  * Check if API key is configured
//  * 
//  * @returns {boolean} True if a real API key is set
//  */
// export function isConfigured() {
//     return USDA_API_KEY !== 'DEMO_KEY' && USDA_API_KEY !== '3CIAqDZEghWgVl3KhB8mUzNaMw2gFQwzcLRqmAZq';
// }

// /**
//  * Search for foods using USDA FoodData Central
//  * 
//  * @param {string} query - Search query (e.g., "chicken breast")
//  * @param {number} pageSize - Number of results to return (default: 25, max: 200)
//  * @returns {Promise<Array>} Array of food objects with nutrition info
//  */
// export async function searchFood(query, pageSize = 25) {
//     try {
//         // Build the API URL with query parameters
//         const url = `${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;
        
//         console.log('Searching USDA FoodData Central for:', query);
        
//         // Make fetch request
//         const response = await fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });
        
//         // Check if request was successful
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
        
//         // Parse JSON response
//         const data = await response.json();
        
//         console.log(`Found ${data.foods ? data.foods.length : 0} results`);
        
//         // Transform and return results
//         return transformFoodResults(data.foods || []);
        
//     } catch (error) {
//         console.error('Error searching USDA API:', error);
        
//         // Return sample foods as fallback
//         if (!isConfigured()) {
//             console.log('Using DEMO_KEY or API not configured. Using sample foods.');
//             return getSampleFoods(query);
//         }
        
//         throw error;
//     }
// }

// /**
//  * Get detailed nutrition information for a specific food by FDC ID
//  * 
//  * @param {number} fdcId - FoodData Central ID
//  * @returns {Promise<Object>} Detailed nutrition information
//  */
// export async function getFoodDetails(fdcId) {
//     try {
//         const url = `${USDA_API_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`;
        
//         console.log('Getting food details for FDC ID:', fdcId);
        
//         const response = await fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });
        
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
        
//         const data = await response.json();
        
//         // Return transformed detailed food info
//         return transformDetailedFood(data);
        
//     } catch (error) {
//         console.error('Error getting food details:', error);
//         throw error;
//     }
// }

// /**
//  * Get multiple foods by their FDC IDs
//  * 
//  * @param {Array<number>} fdcIds - Array of FoodData Central IDs
//  * @returns {Promise<Array>} Array of detailed food objects
//  */
// export async function getMultipleFoods(fdcIds) {
//     try {
//         const url = `${USDA_API_BASE}/foods?api_key=${USDA_API_KEY}`;
        
//         console.log('Getting multiple foods:', fdcIds.length);
        
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 fdcIds: fdcIds
//             })
//         });
        
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
        
//         const foods = await response.json();
        
//         // Transform each food
//         return foods.map(food => transformDetailedFood(food));
        
//     } catch (error) {
//         console.error('Error getting multiple foods:', error);
//         throw error;
//     }
// }

// /**
//  * Transform USDA search results to our app's format
//  * 
//  * @param {Array} foods - Raw food data from API
//  * @returns {Array} Transformed food objects
//  */
// function transformFoodResults(foods) {
//     return foods.map(food => {
//         // Extract basic nutrition info from food nutrients
//         const nutrients = extractNutrients(food.foodNutrients || []);
        
//         return {
//             fdcId: food.fdcId,
//             name: food.description || food.lowercaseDescription || 'Unknown',
//             calories: nutrients.calories,
//             protein: nutrients.protein,
//             carbs: nutrients.carbs,
//             fat: nutrients.fat,
//             dataType: food.dataType, // e.g., "Branded", "Survey (FNDDS)", "SR Legacy"
//             brandOwner: food.brandOwner || null,
//             servingSize: food.servingSize || 100,
//             servingUnit: food.servingSizeUnit || 'g',
//             source: 'usda'
//         };
//     });
// }

// /**
//  * Transform detailed food data from USDA API
//  * 
//  * @param {Object} food - Detailed food object from API
//  * @returns {Object} Transformed food object with full nutrition
//  */
// function transformDetailedFood(food) {
//     const nutrients = extractNutrients(food.foodNutrients || []);
    
//     return {
//         fdcId: food.fdcId,
//         name: food.description,
//         calories: nutrients.calories,
//         protein: nutrients.protein,
//         carbs: nutrients.carbs,
//         fat: nutrients.fat,
//         fiber: nutrients.fiber,
//         sugar: nutrients.sugar,
//         sodium: nutrients.sodium,
//         cholesterol: nutrients.cholesterol,
//         dataType: food.dataType,
//         brandOwner: food.brandOwner || null,
//         ingredients: food.ingredients || null,
//         servingSize: food.servingSize || 100,
//         servingUnit: food.servingSizeUnit || 'g',
//         householdServingFullText: food.householdServingFullText || null,
//         source: 'usda'
//     };
// }

// /**
//  * Extract key nutrients from USDA nutrient array
//  * 
//  * @param {Array} foodNutrients - Array of nutrient objects
//  * @returns {Object} Object with key nutrients
//  */
// function extractNutrients(foodNutrients) {
//     const nutrients = {
//         calories: 0,
//         protein: 0,
//         carbs: 0,
//         fat: 0,
//         fiber: 0,
//         sugar: 0,
//         sodium: 0,
//         cholesterol: 0
//     };
    
//     foodNutrients.forEach(nutrient => {
//         const nutrientName = nutrient.nutrientName || '';
//         const value = nutrient.value || 0;
        
//         // Match nutrient names to our standard fields
//         // Energy (calories) - nutrient ID 1008
//         if (nutrientName.includes('Energy') || nutrient.nutrientId === 1008) {
//             nutrients.calories = Math.round(value);
//         }
//         // Protein - nutrient ID 1003
//         else if (nutrientName.includes('Protein') || nutrient.nutrientId === 1003) {
//             nutrients.protein = Math.round(value);
//         }
//         // Carbohydrates - nutrient ID 1005
//         else if (nutrientName.includes('Carbohydrate') || nutrient.nutrientId === 1005) {
//             nutrients.carbs = Math.round(value);
//         }
//         // Total Fat - nutrient ID 1004
//         else if (nutrientName.includes('Total lipid') || nutrientName.includes('Fat, total') || nutrient.nutrientId === 1004) {
//             nutrients.fat = Math.round(value);
//         }
//         // Fiber - nutrient ID 1079
//         else if (nutrientName.includes('Fiber') || nutrient.nutrientId === 1079) {
//             nutrients.fiber = Math.round(value);
//         }
//         // Sugars - nutrient ID 2000
//         else if (nutrientName.includes('Sugars, total') || nutrient.nutrientId === 2000) {
//             nutrients.sugar = Math.round(value);
//         }
//         // Sodium - nutrient ID 1093
//         else if (nutrientName.includes('Sodium') || nutrient.nutrientId === 1093) {
//             nutrients.sodium = Math.round(value);
//         }
//         // Cholesterol - nutrient ID 1253
//         else if (nutrientName.includes('Cholesterol') || nutrient.nutrientId === 1253) {
//             nutrients.cholesterol = Math.round(value);
//         }
//     });
    
//     return nutrients;
// }

// /**
//  * Get sample foods for demo/testing
//  * Used when API is not configured or as fallback
//  * 
//  * @param {string} query - Search query
//  * @returns {Array} Sample food objects
//  */
// export function getSampleFoods(query) {
//     const sampleFoods = [
//         { 
//             fdcId: 171705,
//             name: 'Chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised', 
//             calories: 165, 
//             protein: 31,
//             carbs: 0,
//             fat: 3.6,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 168878,
//             name: 'Rice, brown, long-grain, cooked', 
//             calories: 111, 
//             protein: 3,
//             carbs: 23,
//             fat: 0.9,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 170379,
//             name: 'Broccoli, cooked, boiled, drained, without salt', 
//             calories: 35, 
//             protein: 2.4,
//             carbs: 7,
//             fat: 0.4,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 171688,
//             name: 'Apples, raw, with skin', 
//             calories: 52, 
//             protein: 0.3,
//             carbs: 14,
//             fat: 0.2,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 173944,
//             name: 'Bananas, raw', 
//             calories: 89, 
//             protein: 1.1,
//             carbs: 23,
//             fat: 0.3,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 175167,
//             name: 'Fish, salmon, Atlantic, farmed, cooked, dry heat', 
//             calories: 206, 
//             protein: 22,
//             carbs: 0,
//             fat: 12,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 173424,
//             name: 'Egg, whole, cooked, hard-boiled', 
//             calories: 155, 
//             protein: 13,
//             carbs: 1.1,
//             fat: 11,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 170903,
//             name: 'Yogurt, Greek, plain, nonfat', 
//             calories: 59, 
//             protein: 10,
//             carbs: 3.6,
//             fat: 0.4,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 170567,
//             name: 'Nuts, almonds', 
//             calories: 579, 
//             protein: 21,
//             carbs: 22,
//             fat: 50,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         },
//         { 
//             fdcId: 168482,
//             name: 'Sweet potato, cooked, baked in skin, flesh, without salt', 
//             calories: 90, 
//             protein: 2,
//             carbs: 21,
//             fat: 0.2,
//             servingSize: 100, 
//             servingUnit: 'g',
//             dataType: 'SR Legacy',
//             source: 'usda'
//         }
//     ];
    
//     // Filter by query if provided
//     if (query) {
//         const lowerQuery = query.toLowerCase();
//         return sampleFoods.filter(food => 
//             food.name.toLowerCase().includes(lowerQuery)
//         );
//     }
    
//     return sampleFoods;
// }

/**
 * USDA FOODDATA CENTRAL API MODULE
 *
 * Handles all interactions with the USDA FoodData Central API.
 * Free nutrition data with search and detailed nutrition endpoints.
 *
 * API Docs: https://fdc.nal.usda.gov/api-guide.html
 */

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
