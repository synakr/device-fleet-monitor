import type { Device, DeviceResponse, Heartbeat } from "./types";

export const HEARTBEAT_TIMEOUT_MS = 30_000;

// In-memory store is sufficient for this 3-hour exercise.
const devices = new Map<string, Device>();

export function registerDevice(id: string, name: string): Device {
  const device: Device = { id, name };
  devices.set(id, device);
  return device;
}

export function getDevice(id: string): Device | undefined {
  return devices.get(id);
}

export function getDevices(): Device[] {
  return Array.from(devices.values());
}

export function saveHeartbeat(id: string, heartbeat: Heartbeat): Device | undefined {
  const device = devices.get(id);
  if (!device) return undefined;

  device.heartbeat = heartbeat;
  return device;
}

export function getDeviceStatus(device: Device): "ONLINE" | "OFFLINE" {
  if (!device.heartbeat) return "OFFLINE";

  const heartbeatTime = new Date(device.heartbeat.timestamp).getTime();
  const age = Date.now() - heartbeatTime;

  return age <= HEARTBEAT_TIMEOUT_MS ? "ONLINE" : "OFFLINE";
}

export function toDeviceResponse(device: Device): DeviceResponse {
  return {
    id: device.id,
    name: device.name,
    status: getDeviceStatus(device),
    last_heartbeat: device.heartbeat?.timestamp ?? null,
  };
}

export function getSummary() {
  let online = 0;
  let offline = 0;

  for (const device of devices.values()) {
    if (getDeviceStatus(device) === "ONLINE") online++;
    else offline++;
  }

  return {
    total: devices.size,
    online,
    offline,
  };
}

// Useful for automated tests.
export function clearStore(): void {
  devices.clear();
}
