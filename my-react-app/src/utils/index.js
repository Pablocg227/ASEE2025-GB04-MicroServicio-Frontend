export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES');
};

export const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export const generateUniqueId = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
};