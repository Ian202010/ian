import { NextResponse } from "next/server";
import { validarCita } from "@/lib/cita";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  // Campo trampa anti-spam: los humanos no lo ven, los bots lo llenan.
  if (typeof body.empresa === "string" && body.empresa.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const result = validarCita(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "no_configurado" },
      { status: 503 },
    );
  }

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/citas`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(result.cita),
  });

  if (!res.ok) {
    console.error("Supabase insert failed", res.status, await res.text());
    return NextResponse.json({ error: "No pudimos guardar tu cita." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
