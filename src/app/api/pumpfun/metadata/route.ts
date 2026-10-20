import { NextResponse } from "next/server";
import { uploadPumpMetadata, PumpLaunchError } from "@/lib/pumpfun/launch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/pumpfun/metadata
 * Body: { name, symbol, description, image, twitter?, telegram?, website? }
 * Uploads the avatar + metadata to Pump.fun's IPFS and returns { uri, name, symbol }.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const name = text("name", 32);
  const symbol = text("symbol", 10).toUpperCase();
  const image = typeof body.image === "string" ? body.image : "";

  if (!name || symbol.length < 2) {
    return NextResponse.json({ error: "A coin name and a ticker (2+ chars) are required." }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Pump.fun requires an avatar image." }, { status: 400 });
  }

  try {
    const result = await uploadPumpMetadata({
      name,
      symbol,
      description: text("description", 500),
      image,
      twitter: text("twitter", 200) || undefined,
      telegram: text("telegram", 200) || undefined,
      website: text("website", 200) || undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PumpLaunchError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Metadata upload failed." }, { status: 500 });
  }
}
