import { mockEmbed, type EmbedFn } from "./rag.js";

async function openAiEmbed(text: string, apiKey: string): Promise<number[]> {
  const dim = Number(process.env.VECTOR_DIMENSION ?? 384);
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: text.slice(0, 8000),
      dimensions: dim <= 1536 ? dim : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    data: { embedding: number[] }[];
  };
  return data.data[0]?.embedding ?? mockEmbed(text, dim);
}

/** Prefer OpenAI embeddings when configured; otherwise deterministic mock. */
export function createEmbedFn(): EmbedFn {
  const provider = process.env.EMBEDDING_PROVIDER ?? "mock";
  const key = process.env.OPENAI_API_KEY;
  if (provider === "openai" && key) {
    return (text) => openAiEmbed(text, key);
  }
  const dim = Number(process.env.VECTOR_DIMENSION ?? 384);
  return async (text) => mockEmbed(text, dim);
}
