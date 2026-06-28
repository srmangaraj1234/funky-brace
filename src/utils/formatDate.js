/**
 * Formats a Date object or string into a clean, human-readable format.
 * @param {Date|string|object} dateInput Timestamp, ISO string, or Firestore Timestamp
 * @returns {string} Formatted date string
 */
export function formatDate(dateInput) {
  if (!dateInput) return '';
  let date = dateInput;
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else {
    date = new Date(dateInput);
  }
  
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
