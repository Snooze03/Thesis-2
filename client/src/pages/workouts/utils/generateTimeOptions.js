// Default behavior (5s to 6min, 5s intervals)
// Custom: 10s to 2min, 10s intervals
// generateTimeOptions(10, 120, 10)
export function generateTimeOptions(startSeconds = 5, endSeconds = 360, intervalSeconds = 5) {
    const options = [];
    for (let seconds = startSeconds; seconds <= endSeconds; seconds += intervalSeconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const display = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        options.push({ value: seconds, display });
    }
    return options;
}