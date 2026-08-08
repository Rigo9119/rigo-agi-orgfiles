import { embed, embedMany } from "ai";
import { ollama } from "ollama-ai-provider-v2";
import type { Chunk } from "./chunk";

export type EmbeddedChunk = Chunk & { embedding: number[] };

const model = ollama.embedding("bge-m3");

export async function embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
  const result = await embedMany({ model, values: chunks.map((chunk) => chunk.text) });

  return chunks.map((chunk, index) => {
    const embedding = result.embeddings[index];
    if (!embedding) {
      throw new Error(`Missing embedding for chunk ${index}`);
    }

    return { ...chunk, embedding };
  });
}
