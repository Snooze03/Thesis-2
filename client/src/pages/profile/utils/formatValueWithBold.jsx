/**
 * Formats a string with a slash (/) by making the part before the slash bold
 * @param {string} value - The string to format (e.g., "5 / 7")
 * @returns {JSX.Element} - Formatted JSX with bold text before slash
 */
export const formatValueWithBold = (value) => {
    if (!value) return null;

    const valueStr = String(value);
    const parts = valueStr.split('/');

    if (parts.length === 2) {
        return (
            <>
                <span className="font-bold text-lg">{parts[0].trim()}</span>
                {' / '}
                {parts[1].trim()}
            </>
        );
    }

    return value;
};