import { NextResponse } from "next/server";

import { createFavorite } from "@/lib/data/store";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await createFavorite("demo-user", params.id);
  return NextResponse.json({ ok: true, action: "favorite", id: params.id });
}
