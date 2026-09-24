import { getDevice, saveHeartbeat } from "@/lib/store";
import type { HeartbeatStatus } from "@/lib/types";

const VALID_STATUSES: HeartbeatStatus[] = ["OK", "WARNING", "ERROR"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const device = getDevice(id);

  if (!device) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { timestamp, status } = body as {
    timestamp?: unknown;
    status?: unknown;
  };

  if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    return Response.json({ error: "timestamp must be a valid ISO-8601 timestamp" }, { status: 400 });
  }

  if (typeof status !== "string" || !VALID_STATUSES.includes(status as HeartbeatStatus)) {
    return Response.json(
      { error: "status must be one of OK, WARNING, ERROR" },
      { status: 400 },
    );
  }

  saveHeartbeat(id, {
    timestamp: new Date(timestamp).toISOString(),
    status: status as HeartbeatStatus,
    receivedAt: new Date().toISOString(),
  });

  return Response.json({ message: "Heartbeat received" });
}
