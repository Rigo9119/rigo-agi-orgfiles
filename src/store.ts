import type { EmbeddedChunk } from "./embed";

export async function saveStore(chunks: EmbeddedChunk[], path: string): Promise<void> {
  await Bun.write(path, JSON.stringify(chunks));
}

export async function loadStore(path: string): Promise<EmbeddedChunk[]> {
  return Bun.file(path).json();
}

export function dotProduct(vectorA: number[], vectorB: number[]): number {
  return vectorA.reduce((sum, val, i) => sum + val * (vectorB?.[i] ?? 0), 0);
}

export function magnitud(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  const dot = dotProduct(a, b);
  const magnitudA = magnitud(a);
  const magnitudB = magnitud(b);

  if (magnitudA === 0 || magnitudB === 0) return 0;

  return dot / (magnitudA * magnitudB);
}
