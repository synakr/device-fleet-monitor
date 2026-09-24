import { getDevice, saveHeartbeat } from "@/lib/store";
import type { HeartbeatStatus } from "@/lib/types";

const VALID_STATUSES: HeartbeatStatus[] = ["OK", "WARNING", "ERROR"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Check whether the device exists.
  const device = getDevice(id);

  if (!device) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }

  let body: unknown;

  // Parse request body.
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Body must be an object.
  if (!body || typeof body !== "object") {
    return Response.json(
      { error: "Request body must be an object" },
      { status: 400 },
    );
  }

  const { status } = body as {
    status?: unknown;
  };

  // Validate heartbeat status.
  if (
    typeof status !== "string" ||
    !VALID_STATUSES.includes(status as HeartbeatStatus)
  ) {
    return Response.json(
      {
        error: "status must be one of OK, WARNING, ERROR",
      },
      { status: 400 },
    );
  }

  // The server determines when the heartbeat was received.
  const now = new Date().toISOString();

  saveHeartbeat(id, {
    timestamp: now,
    status: status as HeartbeatStatus,
    receivedAt: now,
  });

  return Response.json({
    message: "Heartbeat received",
    timestamp: now,
  });
}
