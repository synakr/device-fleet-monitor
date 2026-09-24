import { getSummary } from "@/lib/store";

export async function GET() {
  return Response.json(getSummary());
}
