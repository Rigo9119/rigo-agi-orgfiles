import { readdirSync } from "node:fs";
import path from "node:path";

export type Doc = {
  path: string;
  relPath: string;
  title: string;
  filetags: string[];
  content: string;
};

export function discoverEntries(rootDir: string): string[] {
  return readdirSync(rootDir, {
    withFileTypes: true,
    recursive: true,
  })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".org"))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((entry) => !entry.includes(".git"));
}

export async function loadOrgFiles(rootDir: string): Promise<Doc[]> {
  const entries = discoverEntries(rootDir);
  const docs = await Promise.all(
    entries.map(async (entry) => {
      const relPath = path.relative(rootDir, entry);
      const content = await Bun.file(entry).text();
      const lines = content.split(/\r?\n/).map((line) => line.trim());
      const title =
        lines
          .find((line) => line.toLowerCase().startsWith("#+title:"))
          ?.slice(8)
          .trim() ?? path.basename(entry, ".org");
      const filetags =
        lines
          .find((line) => line.toLowerCase().startsWith("#+filetags:"))
          ?.slice(11)
          .trim()
          .split(":")
          .filter(Boolean) ?? [];

      return {
        path: entry,
        relPath,
        title,
        filetags,
        content,
      };
    }),
  );

  return docs;
}
