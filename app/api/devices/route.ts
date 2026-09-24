import { getDevices, registerDevice, toDeviceResponse } from "@/lib/store";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { id, name } = body as { id?: unknown; name?: unknown };

  if (typeof id !== "string" || !id.trim() || typeof name !== "string" || !name.trim()) {
    return Response.json(
      { error: "id and name are required and must be non-empty strings" },
      { status: 400 },
    );
  }

  const existing = getDevices().find((device) => device.id === id);
  if (existing) {
    return Response.json({ error: "Device already exists" }, { status: 409 });
  }

  const device = registerDevice(id.trim(), name.trim());
  return Response.json(toDeviceResponse(device), { status: 201 });
}

export async function GET() {
  return Response.json(getDevices().map(toDeviceResponse));
}
