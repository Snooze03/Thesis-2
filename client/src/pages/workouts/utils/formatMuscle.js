export function formatMuscle(muscle) {
    if (!muscle) return "";
    return muscle
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};