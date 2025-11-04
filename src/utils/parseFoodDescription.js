/**
 * Parse nutrition information from food description string
 * @param {string} description - Food description in format "Per [serving] - Calories: 140kcal | Fat: 7.00g | Carbs: 0.50g | Protein: 19.00g"
 * @returns {Object} Parsed nutrition data
 */
export const parseFoodDescription = (description) => {
    if (!description || typeof description !== 'string') {
        return null;
    }

    try {
        // Extract serving size (everything between "Per" and "-")
        const servingSizeMatch = description.match(/Per\s+(.+?)\s*-/i);
        const servingSize = servingSizeMatch ? servingSizeMatch[1].trim() : null;

        // Extract nutritional values using regex (handles both with and without units)
        const calories = description.match(/Calories:\s*(\d+(?:\.\d+)?)/i);
        const fat = description.match(/Fat:\s*(\d+(?:\.\d+)?)/i);
        const carbs = description.match(/Carbs:\s*(\d+(?:\.\d+)?)/i);
        const protein = description.match(/Protein:\s*(\d+(?:\.\d+)?)/i);

        return {
            servingSize,
            nutrition: {
                calories: calories ? parseFloat(calories[1]) : null,
                fat: fat ? parseFloat(fat[1]) : null,
                carbs: carbs ? parseFloat(carbs[1]) : null,
                protein: protein ? parseFloat(protein[1]) : null,
            }
        };
    } catch (error) {
        console.error('Error parsing nutrition description:', error);
        return null;
    }
};