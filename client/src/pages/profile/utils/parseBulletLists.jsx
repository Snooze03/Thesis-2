// Helper function to parse bullet list items
export const parseBulletList = (content) => {
    if (!content) return [];

    // Split by bullet points (-, *, or •)
    const items = content.split(/\n?[-*•]\s/).filter(Boolean);
    return items.map(item => item.trim());
};