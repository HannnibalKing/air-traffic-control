const http = require('node:http');

const port = Number(process.env.PORT || 3000);
const aircraft = new Map();

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function detectConflicts(items, separation = 5) {
  const conflicts = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const first = items[i];
      const second = items[j];
      if (Math.abs(first.altitude - second.altitude) < 1000 && distance(first, second) <= separation) {
        conflicts.push({ aircraft: [first.id, second.id], horizontalDistance: distance(first, second), verticalDistance: Math.abs(first.altitude - second.altitude) });
      }
    }
  }
  return conflicts;
}

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(value));
}

const server = http.createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') return json(response, 200, { status: 'ok' });
  if (request.method === 'GET' && request.url === '/api/aircraft') return json(response, 200, [...aircraft.values()]);
  if (request.method === 'GET' && request.url === '/api/conflicts') return json(response, 200, { conflicts: detectConflicts([...aircraft.values()]) });
  if (request.method === 'PUT' && request.url === '/api/aircraft') {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      try {
        const item = JSON.parse(body);
        if (!item.id || !Number.isFinite(item.x) || !Number.isFinite(item.y) || !Number.isFinite(item.altitude)) throw new Error('id, x, y, and altitude are required');
        aircraft.set(item.id, { id: item.id, x: item.x, y: item.y, altitude: item.altitude, updatedAt: new Date().toISOString() });
        json(response, 200, { aircraft: aircraft.get(item.id), conflicts: detectConflicts([...aircraft.values()]) });
      } catch (error) { json(response, 400, { error: error.message }); }
    });
    return;
  }
  json(response, 404, { error: 'not found' });
});

module.exports = { detectConflicts };
if (require.main === module) server.listen(port, () => console.log(`ATC service listening on http://localhost:${port}`));
