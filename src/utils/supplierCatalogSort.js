/**
 * Utility functions for sorting the supplier catalog in ReptileTrack.
 */

const FROZEN_CATEGORY_ORDER = {
  'Mice': 1,
  'Rats': 2,
  'Chicken': 3,
  'Others': 4
};

const INSECT_SIZE_ORDER = {
  'Micro': 1,
  'XS': 2,
  'S': 3,
  'Small': 4,
  'Middle Small': 5,
  'Medium': 6,
  'Middle': 7,
  'Large': 8,
  'Adult': 9,
  'Large/Medium': 10
};

const INSECT_PACKAGING_ORDER = {
  'pc': 1,
  'box': 2,
  '250 pcs': 3,
  'l': 4,
  'kg': 5
};

/**
 * Extracts the first numeric value from a string (sizeLabel or productName).
 * Handles commas as decimal separators.
 */
export const getWeightSortValue = (sizeLabel, productName) => {
  const text = `${sizeLabel || ''} ${productName || ''}`;
  // Match a number with optional decimal (comma or dot)
  const match = text.replace(',', '.').match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : null;
};

export const getCategoryOrder = (category) => {
  return FROZEN_CATEGORY_ORDER[category] || 99;
};

export const getInsectSizeOrder = (sizeLabel) => {
  return INSECT_SIZE_ORDER[sizeLabel] || 99;
};

export const getInsectPackagingOrder = (unit) => {
  return INSECT_PACKAGING_ORDER[unit] || 99;
};

/**
 * Comparator for frozen items (unit, pack, comparison).
 */
export const compareFrozenItems = (a, b) => {
  // 1. Category order
  const orderA = getCategoryOrder(a.category);
  const orderB = getCategoryOrder(b.category);
  if (orderA !== orderB) return orderA - orderB;

  // 2. Weight order
  const weightA = getWeightSortValue(a.sizeLabel, a.productName || a.name);
  const weightB = getWeightSortValue(b.sizeLabel, b.productName || b.name);

  if (weightA !== null && weightB !== null) {
    if (weightA !== weightB) return weightA - weightB;
  } else if (weightA !== null) {
    return -1;
  } else if (weightB !== null) {
    return 1;
  }

  // 3. Alphabetical fallback
  const nameA = (a.productName || a.name || '').toLowerCase();
  const nameB = (b.productName || b.name || '').toLowerCase();
  return nameA.localeCompare(nameB);
};

/**
 * Comparator for insect items.
 */
export const compareInsectItems = (a, b) => {
  // 1. Family alphabetical
  const famA = (a.family || '').toLowerCase();
  const famB = (b.family || '').toLowerCase();
  if (famA !== famB) return famA.localeCompare(famB);

  // 2. Product Name alphabetical
  const nameA = (a.productName || '').toLowerCase();
  const nameB = (b.productName || '').toLowerCase();
  if (nameA !== nameB) return nameA.localeCompare(nameB);

  // 3. Size order
  const sizeA = getInsectSizeOrder(a.sizeLabel);
  const sizeB = getInsectSizeOrder(b.sizeLabel);
  if (sizeA !== sizeB) return sizeA - sizeB;

  // 4. Packaging order
  const packA = getInsectPackagingOrder(a.unit);
  const packB = getInsectPackagingOrder(b.unit);
  if (packA !== packB) return packA - packB;

  return 0;
};
