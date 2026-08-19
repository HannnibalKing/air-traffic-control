# Air Traffic Control Vegas

Dependency-free deterministic conflict-detection service for aircraft positions. It provides a local simulation baseline while keeping future radar, ADS-B, weather, and command interfaces replaceable.

This is a simulation and engineering demo, not certified air-traffic-control software. It must not be connected to operational flight systems without aviation certification, validated surveillance sources, human-controller workflows, redundancy, and regulatory approval.

## Run

```bash
npm test
npm start
```

Endpoints:

- `GET /health`
- `GET /api/aircraft`
- `GET /api/aircraft/:id`
- `PUT /api/aircraft` with `{ "id": "A1", "x": 0, "y": 0, "altitude": 30000 }`
- `GET /api/conflicts`
- `GET /api/config`

The service validates bounded aircraft state, labels surveillance data as `current` or `stale`, and classifies conflicts as `warning` or `critical` using configurable horizontal/vertical thresholds. The current geometry uses a local coordinate plane; production integration requires authenticated feed ingestion, real coordinate reference systems, persistence, clock synchronization, redundant processing, and certified alerting workflows.
