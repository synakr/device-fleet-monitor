import { getDevice, toDeviceResponse } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const device = getDevice(id);

  if (!device) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }

  return Response.json(toDeviceResponse(device));
}
