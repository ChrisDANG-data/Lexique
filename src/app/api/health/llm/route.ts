import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = (process.env.LLM_BASE_URL ?? "http://127.0.0.1:11434/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.LLM_MODEL ?? "llama3.2";

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY ?? "ollama"}`,
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          baseUrl,
          model,
          status: res.status,
          detail: await res.text(),
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, baseUrl, model });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        baseUrl,
        model,
        detail: err instanceof Error ? err.message : String(err),
        hint: "Start Ollama with `ollama serve`, then `ollama pull llama3.2` — or point LLM_* at a cloud API.",
      },
      { status: 503 },
    );
  }
}
