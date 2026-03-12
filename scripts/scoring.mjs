import fs from 'node:fs';
import path from 'node:path';

const scoreByLabelPath = path.join(process.cwd(), 'openblog/enums/scoring-labels.json');
const parsedScoreByLabel = JSON.parse(fs.readFileSync(scoreByLabelPath, 'utf8'));

const getPoints = (config) => {
  if (typeof config === 'number') {
    return config;
  }
  if (config && typeof config === 'object' && typeof config.points === 'number') {
    return config.points;
  }
  return 0;
};

export const SCORE_BY_LABEL = Object.freeze(
  Object.fromEntries(Object.entries(parsedScoreByLabel).map(([label, config]) => [label, getPoints(config)]))
);

export function calculatePoints(labels = []) {
  return labels.reduce((total, label) => total + (SCORE_BY_LABEL[label] ?? 0), 0);
}
