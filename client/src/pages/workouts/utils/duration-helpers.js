/**
 * Validates duration string in MM:SS format
 * @param {string} duration - Duration string (e.g., "02:30")
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateDuration(duration) {
    if (typeof duration !== 'string') {
        return false;
    }

    // Match MM:SS format where MM is 0-99 and SS is 00-59
    const pattern = /^(\d{1,2}):([0-5][0-9])$/;
    const match = duration.match(pattern);

    if (!match) {
        return false;
    }

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);

    // Ensure minutes don't exceed 99
    if (minutes > 99) {
        return false;
    }

    // Ensure it's not zero duration
    if (minutes === 0 && seconds === 0) {
        return false;
    }

    return true;
}

/**
 * Formats minutes and seconds into MM:SS string
 * @param {number} minutes - Number of minutes (0-99)
 * @param {number} seconds - Number of seconds (0-59)
 * @returns {string} - Formatted duration string (e.g., "02:30")
 */
export function formatDuration(minutes, seconds) {
    // Ensure values are within valid ranges
    const validMinutes = Math.max(0, Math.min(99, Math.floor(minutes || 0)));
    const validSeconds = Math.max(0, Math.min(59, Math.floor(seconds || 0)));

    // Pad with zeros
    const paddedMinutes = String(validMinutes).padStart(2, '0');
    const paddedSeconds = String(validSeconds).padStart(2, '0');

    return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Parses MM:SS duration string into object with minutes and seconds
 * @param {string} duration - Duration string (e.g., "02:30")
 * @returns {{minutes: number, seconds: number} | null} - Parsed duration or null if invalid
 */
export function parseDuration(duration) {
    if (!validateDuration(duration)) {
        return null;
    }

    const [minutes, seconds] = duration.split(':').map(num => parseInt(num, 10));

    return {
        minutes,
        seconds
    };
}

/**
 * Converts duration string to total seconds
 * @param {string} duration - Duration string (e.g., "02:30")
 * @returns {number | null} - Total seconds or null if invalid
 */
export function durationToSeconds(duration) {
    const parsed = parseDuration(duration);
    if (!parsed) {
        return null;
    }

    return (parsed.minutes * 60) + parsed.seconds;
}

/**
 * Converts total seconds to MM:SS duration string
 * @param {number} totalSeconds - Total seconds
 * @returns {string} - Formatted duration string (e.g., "02:30")
 */
export function secondsToDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return formatDuration(minutes, seconds);
}

/**
 * Auto-formats user input to MM:SS format while typing
 * @param {string} input - User input string
 * @returns {string} - Formatted or partially formatted string
 */
export function autoFormatDuration(input) {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');

    // If empty, return empty
    if (digitsOnly.length === 0) {
        return '';
    }

    // If only 1 digit, return as is
    if (digitsOnly.length === 1) {
        return digitsOnly;
    }

    // If 2 digits, add colon (MM:)
    if (digitsOnly.length === 2) {
        return `${digitsOnly}:`;
    }

    // If 3 digits, format as MM:S
    if (digitsOnly.length === 3) {
        return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`;
    }

    // If 4+ digits, format as MM:SS and truncate
    const minutes = digitsOnly.slice(0, 2);
    const seconds = digitsOnly.slice(2, 4);

    return `${minutes}:${seconds}`;
}

/**
 * Validates and corrects duration format
 * Ensures seconds don't exceed 59 and minutes don't exceed 99
 * @param {string} duration - Duration string
 * @returns {string} - Corrected duration string
 */
export function correctDuration(duration) {
    const parsed = parseDuration(duration);

    if (!parsed) {
        return '00:00';
    }

    // If seconds are 60 or more, convert to minutes
    if (parsed.seconds >= 60) {
        const extraMinutes = Math.floor(parsed.seconds / 60);
        const remainingSeconds = parsed.seconds % 60;
        parsed.minutes = Math.min(99, parsed.minutes + extraMinutes);
        parsed.seconds = remainingSeconds;
    }

    return formatDuration(parsed.minutes, parsed.seconds);
}

/**
 * Compares two durations
 * @param {string} duration1 - First duration string
 * @param {string} duration2 - Second duration string
 * @returns {number} - Returns -1 if duration1 < duration2, 0 if equal, 1 if duration1 > duration2
 */
export function compareDurations(duration1, duration2) {
    const seconds1 = durationToSeconds(duration1);
    const seconds2 = durationToSeconds(duration2);

    if (seconds1 === null || seconds2 === null) {
        return 0;
    }

    if (seconds1 < seconds2) return -1;
    if (seconds1 > seconds2) return 1;
    return 0;
}

/**
 * Gets a display-friendly duration string
 * @param {string} duration - Duration string (e.g., "02:30")
 * @returns {string} - Display string (e.g., "2 min 30 sec")
 */
export function getDurationDisplay(duration) {
    const parsed = parseDuration(duration);

    if (!parsed) {
        return '0 sec';
    }

    const parts = [];

    if (parsed.minutes > 0) {
        parts.push(`${parsed.minutes} min`);
    }

    if (parsed.seconds > 0) {
        parts.push(`${parsed.seconds} sec`);
    }

    return parts.length > 0 ? parts.join(' ') : '0 sec';
}