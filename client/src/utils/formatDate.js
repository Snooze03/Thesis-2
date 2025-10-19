export const formatDate = (dateString, format = 'MM-DD-YYYY') => {
    const date = new Date(dateString);

    switch (format) {
        case 'MM-DD-YYYY':
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: '2-digit',
                year: 'numeric'
            });
        case 'Month DD, YYYY':
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        case 'MMM DD, YYYY':
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        default:
            return dateString;
    }
};