export function formatSimilarity(score?: number) {
  if (typeof score !== 'number') return '';
  return `${Math.round(score * 100)}%`;
}


