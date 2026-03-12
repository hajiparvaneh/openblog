import fs from 'node:fs';
import path from 'node:path';

const scoreByLabelPath = path.join(process.cwd(), 'game/enums/scoring-labels.json');
const parsedScoreByLabel = JSON.parse(fs.readFileSync(scoreByLabelPath, 'utf8'));

export const SCORE_BY_LABEL = Object.freeze(parsedScoreByLabel);

export function calculatePoints(labels = []) {
  return labels.reduce((total, label) => total + (SCORE_BY_LABEL[label] ?? 0), 0);
}
