export const SCORE_BY_LABEL = Object.freeze({
  typo: 5,
  'source-added': 10,
  'fact-check': 15,
  'new-example': 20,
  translation: 30,
  'new-post': 50
});

export function calculatePoints(labels = []) {
  return labels.reduce((total, label) => total + (SCORE_BY_LABEL[label] ?? 0), 0);
}
