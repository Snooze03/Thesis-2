import { validateDuration } from './duration-helpers';

/**
 * Returns an empty set structure based on set type
 * @param {string} setType - "weight_reps" | "reps_only" | "duration"
 * @returns {object} - Empty set structure
 */
export function getEmptySet(setType) {
    switch (setType) {
        case 'weight_reps':
            return { reps: null, weight: null };
        case 'reps_only':
            return { reps: null };
        case 'duration':
            return { duration: null };
        default:
            return { reps: null, weight: null };
    }
}

/**
 * Converts sets when set type changes
 * Implements "clear all sets" strategy as per requirements
 * @param {Array} sets_data - Current sets array
 * @param {string} oldType - Previous set type
 * @param {string} newType - New set type
 * @returns {Array} - Converted sets array (empty array with one new set)
 */
export function convertSetsOnTypeChange(sets_data, oldType, newType) {
    // Always return a fresh array with one empty set of the new type
    return [getEmptySet(newType)];
}

/**
 * Validates a single set based on set type
 * @param {object} set - Set data object
 * @param {string} setType - "weight_reps" | "reps_only" | "duration"
 * @returns {{isValid: boolean, errors: string[]}} - Validation result
 */
export function validateSet(set, setType) {
    const errors = [];

    if (!set || typeof set !== 'object') {
        return { isValid: false, errors: ['Set must be an object'] };
    }

    switch (setType) {
        case 'weight_reps':
            // Validate reps
            if (!('reps' in set)) {
                errors.push('Reps field is required');
            } else if (set.reps !== null) {
                if (!Number.isInteger(set.reps) || set.reps < 0) {
                    errors.push('Reps must be a non-negative integer or null');
                }
                if (set.reps > 1000) {
                    errors.push('Reps cannot exceed 1000');
                }
            }

            // Validate weight
            if (!('weight' in set)) {
                errors.push('Weight field is required');
            } else if (set.weight !== null) {
                if (typeof set.weight !== 'number' || set.weight < 0) {
                    errors.push('Weight must be a non-negative number or null');
                }
                if (set.weight > 10000) {
                    errors.push('Weight cannot exceed 10000');
                }
            }
            break;

        case 'reps_only':
            // Validate reps
            if (!('reps' in set)) {
                errors.push('Reps field is required');
            } else if (set.reps === null) {
                errors.push('Reps cannot be null for reps_only type');
            } else {
                if (!Number.isInteger(set.reps) || set.reps <= 0) {
                    errors.push('Reps must be a positive integer');
                }
                if (set.reps > 1000) {
                    errors.push('Reps cannot exceed 1000');
                }
            }
            break;

        case 'duration':
            // Validate duration
            if (!('duration' in set)) {
                errors.push('Duration field is required');
            } else if (set.duration === null) {
                errors.push('Duration cannot be null for duration type');
            } else if (typeof set.duration !== 'string') {
                errors.push('Duration must be a string in MM:SS format');
            } else if (!validateDuration(set.duration)) {
                errors.push('Duration must be in MM:SS format (e.g., "02:30")');
            }
            break;

        default:
            errors.push(`Invalid set type: ${setType}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates an array of sets
 * @param {Array} sets_data - Array of set objects
 * @param {string} setType - "weight_reps" | "reps_only" | "duration"
 * @returns {{isValid: boolean, errors: object[]}} - Validation result with errors per set
 */
export function validateSetsData(sets_data, setType) {
    if (!Array.isArray(sets_data)) {
        return {
            isValid: false,
            errors: [{ set: null, messages: ['Sets data must be an array'] }]
        };
    }

    if (sets_data.length === 0) {
        return {
            isValid: false,
            errors: [{ set: null, messages: ['At least one set is required'] }]
        };
    }

    if (sets_data.length > 50) {
        return {
            isValid: false,
            errors: [{ set: null, messages: ['Cannot have more than 50 sets'] }]
        };
    }

    const allErrors = [];
    let hasErrors = false;

    sets_data.forEach((set, index) => {
        const validation = validateSet(set, setType);
        if (!validation.isValid) {
            hasErrors = true;
            allErrors.push({
                set: index + 1,
                messages: validation.errors
            });
        }
    });

    return {
        isValid: !hasErrors,
        errors: allErrors
    };
}

/**
 * Checks if a set is complete (has valid data entered)
 * @param {object} set - Set data object
 * @param {string} setType - "weight_reps" | "reps_only" | "duration"
 * @returns {boolean} - True if set is complete
 */
export function isSetComplete(set, setType) {
    if (!set || typeof set !== 'object') {
        return false;
    }

    switch (setType) {
        case 'weight_reps':
            return set.reps !== null && set.reps > 0 &&
                set.weight !== null && set.weight >= 0;

        case 'reps_only':
            return set.reps !== null && set.reps > 0;

        case 'duration':
            return set.duration !== null &&
                typeof set.duration === 'string' &&
                validateDuration(set.duration);

        default:
            return false;
    }
}

/**
 * Checks if all sets in an array are complete
 * @param {Array} sets_data - Array of set objects
 * @param {string} setType - "weight_reps" | "reps_only" | "duration"
 * @returns {boolean} - True if all sets are complete
 */
export function areAllSetsComplete(sets_data, setType) {
    if (!Array.isArray(sets_data) || sets_data.length === 0) {
        return false;
    }

    return sets_data.every(set => isSetComplete(set, setType));
}

/**
 * Gets the number of completed sets
 * @param {Array} sets_data - Array of set objects
 * @param {string} setType - "weight_reps" | "reps_only" | "duration"
 * @returns {number} - Count of completed sets
 */
export function getCompletedSetsCount(sets_data, setType) {
    if (!Array.isArray(sets_data)) {
        return 0;
    }

    return sets_data.filter(set => isSetComplete(set, setType)).length;
}

/**
 * Calculates total volume for weight_reps exercises
 * @param {Array} sets_data - Array of set objects
 * @returns {number} - Total volume (reps × weight)
 */
export function calculateTotalVolume(sets_data) {
    if (!Array.isArray(sets_data)) {
        return 0;
    }

    return sets_data.reduce((total, set) => {
        if (set.reps && set.weight) {
            return total + (set.reps * set.weight);
        }
        return total;
    }, 0);
}

/**
 * Formats set data for display
 * @param {object} set - Set data object
 * @param {string} setType - "weight_reps" | "reps_only" | "duration"
 * @param {string} weightUnit - "kg" | "lbs"
 * @returns {string} - Formatted display string
 */
export function formatSetDisplay(set, setType, weightUnit = 'kg') {
    if (!set || typeof set !== 'object') {
        return 'Invalid set';
    }

    switch (setType) {
        case 'weight_reps':
            const reps = set.reps ?? '-';
            const weight = set.weight ?? '-';
            return `${reps} reps × ${weight}${weightUnit}`;

        case 'reps_only':
            return `${set.reps ?? '-'} reps`;

        case 'duration':
            return set.duration ?? '00:00';

        default:
            return 'Unknown format';
    }
}

/**
 * Gets the set type display name
 * @param {string} setType - "weight_reps" | "reps_only" | "duration"
 * @returns {string} - Display name
 */
export function getSetTypeDisplayName(setType) {
    const displayNames = {
        'weight_reps': 'Weight & Reps',
        'reps_only': 'Reps Only',
        'duration': 'Duration'
    };

    return displayNames[setType] || 'Unknown';
}

/**
 * Gets valid set type options
 * @returns {Array} - Array of set type options
 */
export function getSetTypeOptions() {
    return [
        { value: 'weight_reps', label: 'Weight & Reps' },
        { value: 'reps_only', label: 'Reps Only' },
        { value: 'duration', label: 'Duration' }
    ];
}