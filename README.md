# Mini Device Fleet Monitor

A small device fleet monitoring service built with **Next.js, TypeScript, and an in-memory data store**.

The application provides REST APIs for registering devices, receiving heartbeats, checking device status, and viewing fleet-wide health. A simulator is included to generate heartbeats from multiple devices and demonstrate automatic `ONLINE` → `OFFLINE` transitions.

---

## Features

- Register devices with an ID and name
- Receive device heartbeats
- Track the latest heartbeat for each device
- Automatically determine device status:
  - `ONLINE` — heartbeat received within the last 30 seconds
  - `OFFLINE` — no heartbeat received for more than 30 seconds

- List all registered devices
- View an individual device
- View fleet summary
- Validate API request payloads
- Handle missing devices and invalid requests
- Simulate a fleet of multiple devices
- Automated tests covering the core requirements

---

## Tech Stack

- **Next.js 16** — API routes / application runtime
- **TypeScript** — type safety
- **Node.js** — runtime
- **Vitest** — automated testing
- **In-memory `Map`** — simple device storage
- **Node.js `fetch`** — simulator HTTP communication

No external database is required.

---

## Architecture

The project intentionally uses a small and simple architecture because the assignment focuses on correctness, maintainability, and completing the core monitoring functionality without unnecessary infrastructure.

```text
device-fleet-monitor/
│
├── app/
│   └── api/
│       ├── devices/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── heartbeat/
│       │           └── route.ts
│       │
│       └── summary/
│           └── route.ts
│
├── lib/
│   ├── store.ts
│   └── types.ts
│
├── simulator/
│   └── simulator.mjs
│
├── tests/
│   └── devices.test.ts
│
├── vitest.config.ts
├── package.json
└── README.md
```

### Main components

**API routes**

The `app/api` directory contains the REST API endpoints.

**Store**

`lib/store.ts` contains the in-memory device store and centralizes:

- Device registration
- Device lookup
- Heartbeat storage
- ONLINE/OFFLINE status calculation
- Fleet summary calculation

**Types**

`lib/types.ts` defines the TypeScript models used by the application.

**Simulator**

`simulator/simulator.mjs` simulates multiple devices sending periodic heartbeats.

**Tests**

`tests/devices.test.ts` contains automated tests for registration, heartbeat handling, device status, timeout behavior, and fleet summary.

---

## Prerequisites

Make sure the following are installed:

- Node.js 20+
- npm

Check your versions:

```bash
node --version
npm --version
```

---

## Installation

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd device-fleet-monitor
```

Install dependencies:

```bash
npm install
```

---

## Running the Application

Start the development server:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

---

## Building for Production

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# API

## 1. Register a Device

### Request

```http
POST /devices
Content-Type: application/json
```

Body:

```json
{
  "id": "device-01",
  "name": "Device 01"
}
```

### Example

```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"device-01\",\"name\":\"Device 01\"}"
```

### Response

```json
{
  "id": "device-01",
  "name": "Device 01",
  "status": "OFFLINE",
  "last_heartbeat": null
}
```

A newly registered device starts as `OFFLINE` because it has not sent a heartbeat yet.

### Possible errors

- `400` — invalid request body
- `409` — device ID already exists

---

## 2. Send a Heartbeat

### Request

```http
POST /devices/{id}/heartbeat
Content-Type: application/json
```

Body:

```json
{
  "status": "OK"
}
```

Valid statuses are:

```text
OK
WARNING
ERROR
```

### Example

```bash
curl -X POST http://localhost:3000/api/devices/device-01/heartbeat \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"OK\"}"
```

### Response

```json
{
  "message": "Heartbeat received",
  "timestamp": "2026-09-24T10:00:00.000Z"
}
```

The server records the time at which the heartbeat is received. This avoids relying on the simulator/device clock when determining the 30-second timeout.

### Possible errors

- `400` — invalid JSON or invalid heartbeat status
- `404` — device does not exist

---

## 3. List All Devices

### Request

```http
GET /devices
```

### Example

```bash
curl http://localhost:3000/api/devices
```

### Response

```json
[
  {
    "id": "device-01",
    "name": "Device 01",
    "status": "ONLINE",
    "last_heartbeat": "2026-09-24T10:00:00.000Z"
  },
  {
    "id": "device-02",
    "name": "Device 02",
    "status": "OFFLINE",
    "last_heartbeat": null
  }
]
```

---

## 4. Get a Device

### Request

```http
GET /devices/{id}
```

### Example

```bash
curl http://localhost:3000/api/devices/device-01
```

### Response

```json
{
  "id": "device-01",
  "name": "Device 01",
  "status": "ONLINE",
  "last_heartbeat": "2026-09-24T10:00:00.000Z"
}
```

If the device does not exist:

```json
{
  "error": "Device not found"
}
```

with HTTP status:

```text
404
```

---

## 5. Fleet Summary

### Request

```http
GET /summary
```

### Example

```bash
curl http://localhost:3000/api/summary
```

### Response

```json
{
  "total": 5,
  "online": 4,
  "offline": 1
}
```

---

# Device Status Logic

A device is considered `ONLINE` when its latest heartbeat was received within the last **30 seconds**.

```text
heartbeat age <= 30 seconds
        ↓
     ONLINE
```

If the latest heartbeat is older than 30 seconds:

```text
heartbeat age > 30 seconds
        ↓
     OFFLINE
```

A device with no heartbeat is also `OFFLINE`.

The status is calculated when the API is queried rather than stored as a permanent value. This means a device can automatically transition from `ONLINE` to `OFFLINE` without requiring a background process.

For example:

```text
10:00:00  heartbeat received
10:00:00  ONLINE

10:00:20  ONLINE

10:00:30  still within timeout
          ONLINE

10:00:31  heartbeat is older than 30s
          OFFLINE
```

---

# Simulator

The project includes a simulator for testing the fleet behavior.

The simulator creates at least five devices and sends heartbeats approximately every five seconds.

Start the application first:

```bash
npm run dev
```

Then, in another terminal:

```bash
node simulator/simulator.mjs
```

The simulator registers the devices and periodically sends heartbeats.

Example simulated devices:

```text
device-01
device-02
device-03
device-04
device-05
```

---

## Demonstrating an Offline Device

To demonstrate the required timeout behavior:

1. Start the API server.
2. Start the simulator.
3. Verify that the devices are `ONLINE`.
4. Stop one simulated device.
5. Wait more than 30 seconds.
6. Query:

```bash
curl http://localhost:3000/api/summary
```

The stopped device should become `OFFLINE`.

For example:

```json
{
  "total": 5,
  "online": 4,
  "offline": 1
}
```

This demonstrates that the status is derived from heartbeat freshness rather than manually toggled.

---

# Automated Tests

The project uses **Vitest** for automated testing.

Run all tests:

```bash
npm test
```

Current test coverage includes:

- Device registration
- Duplicate device registration
- Device listing
- Valid heartbeat handling
- Invalid heartbeat status
- Unknown device handling
- Device becoming `ONLINE` after a heartbeat
- Device becoming `OFFLINE` after the 30-second timeout
- Fleet summary counts

The current test suite contains **9 automated tests**.

Example successful run:

```text
Test Files  1 passed
Tests       9 passed
```

The 30-second timeout test uses controlled system time so the test does not actually need to wait 30 seconds.

---

# Validation and Error Handling

The API validates incoming requests and returns appropriate HTTP status codes.

Examples:

| Situation                       | Status |
| ------------------------------- | -----: |
| Successful device registration  |  `201` |
| Successful heartbeat            |  `200` |
| Successful GET request          |  `200` |
| Invalid JSON                    |  `400` |
| Missing/invalid required fields |  `400` |
| Invalid heartbeat status        |  `400` |
| Duplicate device                |  `409` |
| Unknown device                  |  `404` |

---

# Data Storage

The application uses an in-memory JavaScript `Map`:

```text
Map<deviceId, Device>
```

This was intentionally chosen because the assignment does not require persistent storage and the project is intended to remain small and easy to understand.

### Consequence

All registered devices and heartbeat information are lost when the application process restarts.

---

# Assumptions

- Device IDs are unique.
- A device must be registered before sending a heartbeat.
- A device without a heartbeat is considered `OFFLINE`.
- The latest heartbeat determines the device's current status.
- The ONLINE timeout is exactly 30 seconds.
- The server's receipt time is used for heartbeat freshness.
- Heartbeat status is informational and does not independently determine whether a device is `ONLINE` or `OFFLINE`.
- The application is intended for a single running process using in-memory state.

---

# Limitations

This implementation intentionally avoids infrastructure that was not required for the assignment.

Current limitations include:

- Data is not persisted.
- State is local to a single application process.
- Multiple application instances would not share device state.
- There is no authentication or authorization.
- There is no database.
- There is no frontend dashboard.
- There is no historical heartbeat storage.
- There is no metrics/observability system.
- The simulator is intended for local testing rather than production device communication.

---

# What I Would Improve With One More Day

If additional development time were available, I would prioritize:

1. **Persistent storage**
   - Add PostgreSQL or another durable database.
   - Store devices and latest heartbeat information.

2. **Authentication**
   - Authenticate devices when sending heartbeats.
   - Protect management endpoints.

3. **Observability**
   - Add structured logging.
   - Add application metrics such as heartbeat rate and offline-device count.

4. **Monitoring dashboard**
   - Add a small web dashboard showing device status and fleet health.

5. **Better simulator controls**
   - Allow individual devices to be started/stopped from the command line.
   - Configure device count and heartbeat interval through environment variables.

6. **API documentation**
   - Add OpenAPI/Swagger documentation.

7. **Production deployment**
   - Add environment-based configuration and deployment configuration.

---

# Design Decisions

### Why an in-memory store?

The assignment is a small three-hour engineering project. A `Map` provides constant-time device lookup while keeping the implementation simple and focused on the required behavior.

### Why calculate status dynamically?

Persisting a boolean `online` value would require additional background logic to mark devices offline.

Instead, the application calculates:

```text
current time - last heartbeat time
```

whenever device status is requested.

This makes the 30-second rule explicit and avoids a background timeout worker.

### Why use server receipt time?

Heartbeat freshness depends on when the server received the heartbeat. Using server time avoids incorrect status calculations caused by device clock differences.

---

# Available Scripts

| Command                        | Purpose                  |
| ------------------------------ | ------------------------ |
| `npm run dev`                  | Start development server |
| `npm run build`                | Create production build  |
| `npm start`                    | Start production server  |
| `npm run lint`                 | Run ESLint               |
| `npm test`                     | Run automated tests      |
| `node simulator/simulator.mjs` | Start device simulator   |

---

# AI Usage

AI tools were used during development as an engineering assistant.

### Tools used

- **ChatGPT**

### How AI was used

AI assistance was used for:

- Discussing the overall project architecture.
- Choosing a lightweight implementation appropriate for the three-hour constraint.
- Reviewing API design and validation.
- Explaining the 30-second heartbeat timeout logic.
- Helping structure the automated tests.
- Reviewing implementation decisions and debugging issues.

### Example of an AI-generated suggestion that was changed/improved

An initial heartbeat implementation accepted the device-provided `timestamp` and used it to determine heartbeat freshness.

This was changed so that the server records the heartbeat receipt time instead.

The final implementation uses:

```text
server receipt time
        ↓
latest heartbeat timestamp
        ↓
current time - heartbeat time
        ↓
ONLINE / OFFLINE
```

This avoids relying on synchronized clocks between simulated devices and the server and makes the timeout behavior deterministic.

### Personal verification

The API behavior was manually verified using HTTP requests/Postman, and the automated test suite was executed locally.

The final test run verified:

```text
Test Files  1 passed
Tests       9 passed
```

The 30-second timeout behavior was also specifically tested by advancing the test clock beyond the timeout threshold.

---

# Project Status

The implementation covers the required API functionality, simulator behavior, automatic 30-second device status handling, validation, and automated tests.

Before submission, run the final verification:

```bash
npm run lint
npm run build
npm test
```

Then verify the simulator end-to-end and push the repository with the complete README.
