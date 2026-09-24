"use client";

import { useState } from "react";

const BASE_URL = "";

export default function ApiTesterPage() {
  const [output, setOutput] = useState("");

  async function execute(
    method: string,
    path: string,
    body?: object,
  ) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      setOutput(
        `${response.status} ${response.statusText}\n\n${JSON.stringify(
          data,
          null,
          2,
        )}`,
      );
    } catch (error) {
      setOutput(String(error));
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <h1>Device Fleet Monitor API Tester</h1>

      <div style={{ display: "grid", gap: 12, marginTop: 30 }}>
        <button
          onClick={() =>
            execute("POST", "/api/devices", {
              id: "device-1",
              name: "Device 1",
            })
          }
        >
          ▶ Register Device
        </button>

        <button
          onClick={() =>
            execute("POST", "/api/devices/device-1/heartbeat", {
              status: "OK",
            })
          }
        >
          ▶ Send Heartbeat
        </button>

        <button
          onClick={() => execute("GET", "/api/devices")}
        >
          ▶ List Devices
        </button>

        <button
          onClick={() =>
            execute("GET", "/api/devices/device-1")
          }
        >
          ▶ Get Device
        </button>

        <button
          onClick={() => execute("GET", "/api/summary")}
        >
          ▶ Get Summary
        </button>
      </div>

      <pre
        style={{
          marginTop: 30,
          padding: 20,
          background: "#f5f5f5",
          borderRadius: 8,
          overflow: "auto",
        }}
      >
        {output || "API response will appear here..."}
      </pre>
    </main>
  );
}