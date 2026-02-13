import { NextResponse } from "next/server";

import { createExclude } from "@/lib/data/store";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await createExclude("demo-user", params.id);
  return NextResponse.json({ ok: true, action: "exclude", id: params.id });
}
