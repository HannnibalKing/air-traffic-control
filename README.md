# Air Traffic Control Vegas

Dependency-free deterministic conflict-detection service for aircraft positions. It provides a local simulation baseline while keeping future radar, ADS-B, weather, and command interfaces replaceable.

## Run

```bash
npm test
npm start
```

Endpoints:

- `GET /health`
- `GET /api/aircraft`
- `PUT /api/aircraft` with `{ "id": "A1", "x": 0, "y": 0, "altitude": 30000 }`
- `GET /api/conflicts`

The current geometry uses a local coordinate plane and configurable separation logic. Production integration still requires authenticated feed ingestion, persistence, coordinate-system definitions, and certified alerting workflows.
