export type HeartbeatStatus = "OK" | "WARNING" | "ERROR";
export type DeviceStatus = "ONLINE" | "OFFLINE";

export interface Heartbeat {
  timestamp: string;
  status: HeartbeatStatus;
  receivedAt: string;
}

export interface Device {
  id: string;
  name: string;
  heartbeat?: Heartbeat;
}

export interface DeviceResponse {
  id: string;
  name: string;
  status: DeviceStatus;
  last_heartbeat: string | null;
}
