import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as listDevices,
  POST as registerDevice,
} from "@/app/api/devices/route";

import { GET as getDevice } from "@/app/api/devices/[id]/route";

import { POST as heartbeat } from "@/app/api/devices/[id]/heartbeat/route";

import { GET as getSummary } from "@/app/api/summary/route";

import { clearStore } from "@/lib/store";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function params(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

async function responseJson(response: Response) {
  return response.json();
}

beforeEach(() => {
  clearStore();
  vi.useRealTimers();
});

describe("Device registration", () => {
  it("registers a device successfully", async () => {
    const response = await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Device 01",
      }),
    );

    expect(response.status).toBe(201);

    const body = await responseJson(response);

    expect(body.id).toBe("device-01");
    expect(body.name).toBe("Device 01");
    expect(body.status).toBe("OFFLINE");
  });

  it("rejects duplicate device registration", async () => {
    await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Device 01",
      }),
    );

    const response = await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Another Name",
      }),
    );

    expect(response.status).toBe(409);
  });
});

describe("Device listing", () => {
  it("lists registered devices", async () => {
    await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Device 01",
      }),
    );

    await registerDevice(
      jsonRequest({
        id: "device-02",
        name: "Device 02",
      }),
    );

    const response = await listDevices();

    expect(response.status).toBe(200);

    const body = await responseJson(response);

    expect(body).toHaveLength(2);
    expect(body[0].id).toBe("device-01");
    expect(body[1].id).toBe("device-02");
  });
});

describe("Heartbeat handling", () => {
  it("accepts a valid heartbeat", async () => {
    await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Device 01",
      }),
    );

    const response = await heartbeat(
      jsonRequest({
        status: "OK",
      }),
      params("device-01"),
    );

    expect(response.status).toBe(200);

    const body = await responseJson(response);

    expect(body.message).toBe("Heartbeat received");
    expect(body.timestamp).toBeDefined();
  });

  it("rejects an invalid heartbeat status", async () => {
    await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Device 01",
      }),
    );

    const response = await heartbeat(
      jsonRequest({
        status: "INVALID",
      }),
      params("device-01"),
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown device", async () => {
    const response = await heartbeat(
      jsonRequest({
        status: "OK",
      }),
      params("unknown-device"),
    );

    expect(response.status).toBe(404);
  });
});

describe("Device status", () => {
  it("is ONLINE immediately after a heartbeat", async () => {
    await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Device 01",
      }),
    );

    await heartbeat(
      jsonRequest({
        status: "OK",
      }),
      params("device-01"),
    );

    const response = await getDevice(
      new Request("http://localhost"),
      params("device-01"),
    );

    const body = await responseJson(response);

    expect(body.status).toBe("ONLINE");
    expect(body.last_heartbeat).not.toBeNull();
  });

  it("becomes OFFLINE after 30 seconds", async () => {
    vi.useFakeTimers();

    const start = new Date("2026-09-24T10:00:00.000Z");
    vi.setSystemTime(start);

    await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Device 01",
      }),
    );

    await heartbeat(
      jsonRequest({
        status: "OK",
      }),
      params("device-01"),
    );

    vi.advanceTimersByTime(31_000);

    const response = await getDevice(
      new Request("http://localhost"),
      params("device-01"),
    );

    const body = await responseJson(response);

    expect(body.status).toBe("OFFLINE");
  });
});

describe("Fleet summary", () => {
  it("returns total, online and offline counts", async () => {
    await registerDevice(
      jsonRequest({
        id: "device-01",
        name: "Device 01",
      }),
    );

    await registerDevice(
      jsonRequest({
        id: "device-02",
        name: "Device 02",
      }),
    );

    await heartbeat(
      jsonRequest({
        status: "OK",
      }),
      params("device-01"),
    );

    const response = await getSummary();

    const body = await responseJson(response);

    expect(body).toEqual({
      total: 2,
      online: 1,
      offline: 1,
    });
  });
});
