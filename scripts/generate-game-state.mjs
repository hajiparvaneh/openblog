import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const eventsDir = path.join(root, 'game/events');
const generatedUsersDir = path.join(root, 'game/generated/users');
const leaderboardFile = path.join(root, 'game/generated/leaderboard.json');

fs.mkdirSync(generatedUsersDir, { recursive: true });

const events = fs
  .readdirSync(eventsDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf8')))
  .sort((a, b) => a.mergedAt.localeCompare(b.mergedAt));

const users = new Map();

for (const event of events) {
  const current = users.get(event.username) ?? {
    username: event.username,
    totalPoints: 0,
    acceptedPrs: 0,
    events: []
  };

  current.totalPoints += event.points;
  current.acceptedPrs += 1;
  current.events.push(event.prNumber);
  users.set(event.username, current);
}

for (const user of users.values()) {
  const userPath = path.join(generatedUsersDir, `${user.username}.json`);
  fs.writeFileSync(userPath, `${JSON.stringify(user, null, 2)}\n`);
}

const leaderboard = [...users.values()]
  .map(({ events: _events, ...item }) => item)
  .sort((a, b) => b.totalPoints - a.totalPoints || b.acceptedPrs - a.acceptedPrs);

fs.writeFileSync(
  leaderboardFile,
  `${JSON.stringify({ updatedAt: new Date().toISOString(), leaderboard }, null, 2)}\n`
);

console.log(`Generated leaderboard for ${leaderboard.length} users.`);
