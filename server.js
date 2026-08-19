const http = require('node:http');

const port = Number(process.env.PORT || 3000);
const aircraft = new Map();
const STALE_AFTER_MS = Number(process.env.STALE_AFTER_MS || 30_000);
const DEFAULT_SEPARATION = { horizontal: 5, vertical: 1000 };

function validateAircraft(item) {
  if (!item || typeof item.id !== 'string' || !item.id.trim()) return 'id is required';
  if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) return 'x and y must be numbers in the local coordinate plane';
  if (!Number.isFinite(item.altitude) || item.altitude < 0) return 'altitude must be a non-negative number';
  if (item.x < -1000 || item.x > 1000 || item.y < -1000 || item.y > 1000) return 'x and y must be within the configured simulation bounds';
  return null;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function detectConflicts(items, separation = DEFAULT_SEPARATION) {
  const conflicts = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const first = items[i];
      const second = items[j];
      const horizontalDistance = distance(first, second);
      const verticalDistance = Math.abs(first.altitude - second.altitude);
      if (verticalDistance < separation.vertical && horizontalDistance <= separation.horizontal) {
        const critical = horizontalDistance <= separation.horizontal / 2 && verticalDistance < separation.vertical / 2;
        conflicts.push({ aircraft: [first.id, second.id], horizontalDistance, verticalDistance, severity: critical ? 'critical' : 'warning', units: { horizontal: 'simulation-units', vertical: 'ft' } });
      }
    }
  }
  return conflicts;
}

function withFreshness(item, now = Date.now()) {
  const ageMs = now - new Date(item.updatedAt).getTime();
  return { ...item, ageMs, freshness: ageMs > STALE_AFTER_MS ? 'stale' : 'current' };
}

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(value));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/health') return json(response, 200, { status: 'ok', aircraftCount: aircraft.size });
  if (request.method === 'GET' && url.pathname === '/api/config') return json(response, 200, { coordinateSystem: 'local-simulation-plane', altitudeUnit: 'ft', separation: DEFAULT_SEPARATION, staleAfterMs: STALE_AFTER_MS, certification: 'not for operational ATC use' });
  if (request.method === 'GET' && url.pathname === '/api/aircraft') return json(response, 200, [...aircraft.values()].map(withFreshness));
  if (request.method === 'GET' && url.pathname === '/api/conflicts') return json(response, 200, { generatedAt: new Date().toISOString(), conflicts: detectConflicts([...aircraft.values()]) });
  if (request.method === 'GET' && url.pathname.startsWith('/api/aircraft/')) { const item = aircraft.get(url.pathname.split('/').pop()); return item ? json(response, 200, withFreshness(item)) : json(response, 404, { error: 'aircraft not found' }); }
  if (request.method === 'PUT' && url.pathname === '/api/aircraft') {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      try {
        const item = JSON.parse(body);
        const validationError = validateAircraft(item);
        if (validationError) throw new Error(validationError);
        aircraft.set(item.id, { id: item.id, x: item.x, y: item.y, altitude: item.altitude, callsign: item.callsign || item.id, source: item.source || 'manual-simulation', updatedAt: new Date().toISOString() });
        json(response, 200, { aircraft: aircraft.get(item.id), conflicts: detectConflicts([...aircraft.values()]) });
      } catch (error) { json(response, 400, { error: error.message }); }
    });
    return;
  }
  json(response, 404, { error: 'not found' });
});

module.exports = { detectConflicts, validateAircraft, withFreshness, aircraft };
if (require.main === module) server.listen(port, () => console.log(`ATC service listening on http://localhost:${port}`));
