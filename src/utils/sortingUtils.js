/**
 * Utility for alphabetical sorting in French, case-insensitive,
 * and placing empty values at the end.
 * 
 * @param {Array} list - The list of objects to sort
 * @param {Function} selector - Function to get the string to sort by from an object
 * @returns {Array} - The sorted list
 */
export const sortAlphabetically = (list, selector) => {
  if (!list || !Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    const valA = selector(a)?.toString().trim() || '';
    const valB = selector(b)?.toString().trim() || '';

    // If both are empty, they are equal
    if (!valA && !valB) return 0;
    
    // Empty values go to the end
    if (!valA) return 1;
    if (!valB) return -1;

    // Standard French alphabetical comparison, case-insensitive
    return valA.localeCompare(valB, 'fr', { sensitivity: 'base', numeric: true });
  });
};
