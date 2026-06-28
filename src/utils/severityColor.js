/**
 * Resolves Tailwind styling classes depending on issue severity rating.
 * @param {string} severity 'low' | 'medium' | 'high'
 * @returns {object} { text, bg, border } classes
 */
export function getSeverityStyle(severity) {
  switch (String(severity).toLowerCase()) {
    case 'high':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-950/40',
        border: 'border-rose-800/60',
      };
    case 'medium':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-950/40',
        border: 'border-amber-800/60',
      };
    case 'low':
    default:
      return {
        text: 'text-green-400',
        bg: 'bg-green-950/40',
        border: 'border-green-800/60',
      };
  }
}
