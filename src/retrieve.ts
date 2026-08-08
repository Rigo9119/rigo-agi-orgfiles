import { embed } from "ai";
import { ollama } from "ollama-ai-provider-v2";
import type { EmbeddedChunk } from "./embed";
import { cosineSimilarity } from "./store";

const TOPK_TRESHOLD = 5;

export type RetrieveResult = EmbeddedChunk & { score: number };

const model = ollama.embedding("bge-m3");

export async function retrieve(
  query: string,
  chunks: EmbeddedChunk[],
  topK = TOPK_TRESHOLD,
): Promise<RetrieveResult[]> {
  const result = await embed({
    model,
    value: query,
  });

  return chunks
    .map((chunk) => {
      return {
        ...chunk,
        score: cosineSimilarity(chunk.embedding, result.embedding),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
