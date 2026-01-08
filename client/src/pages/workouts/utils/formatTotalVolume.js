import { LBS_TO_KG } from "../constants";

export function formatTotalVolume(volumeData) {
    const units = Object.keys(volumeData.unitCounts);

    if (units.length === 0) {
        return '0kg';
    }

    // If only one unit is used across all exercises
    if (units.length === 1) {
        const unit = units[0];
        const totalVolume = volumeData.exercises.reduce((sum, ex) => sum + ex.volume, 0);
        return `${totalVolume.toFixed(1)}${unit}`;
    }

    // If mixed units - convert everything to kg
    const totalVolumeInKg = volumeData.exercises.reduce((sum, ex) => {
        const volumeInKg = ex.unit === 'lbs'
            ? ex.volume * LBS_TO_KG
            : ex.volume;
        return sum + volumeInKg;
    }, 0);

    return `${totalVolumeInKg.toFixed(1)}kg`;
};