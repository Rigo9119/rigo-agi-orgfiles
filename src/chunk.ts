import type { Doc } from "./ingest";

export type Chunk = {
  text: string;
  headingPath: string[];
  sourceTitle: string;
  sourceRelPath: string;
  sourceTags: string[];
};

export type Section = {
  headingPath: string[];
  lines: string[];
};

export type HeadingType = {
  level: number;
  text: string;
};

function parseHeading(line: string): HeadingType | null {
  const regex = /^(\*+)\s+(.*)$/;
  const match = line.match(regex);

  if (match) {
    return {
      level: match[1]?.length ?? 0,
      text: match[2] ?? "",
    };
  }
  return null;
}

function splitIntoSections(lines: string[]): Section[] {
  const sections: Section[] = [];
  let stack: HeadingType[] = [];
  let currentSection: Section = { headingPath: [], lines: [] };

  for (const line of lines) {
    const heading = parseHeading(line);
    if (heading) {
      sections.push(currentSection);
      while ((stack[stack.length - 1]?.level ?? 0) >= heading.level) {
        stack.pop();
      }
      stack.push(heading);
      currentSection = { headingPath: stack.map((h) => h.text), lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  sections.push(currentSection);

  return sections;
}

function sectionToText(section: Section): string | null {
  const drawerRegex = /^[ \t]*:PROPERTIES:[\s\S]*?:END:[ \t]*\n?/gm;
  const commentRegex = /^#\+[\w-]+:.*$/gm;
  const joined = section.lines.join("\n");
  const cleanedText = joined.replace(drawerRegex, "").replace(commentRegex, "").trim();

  return cleanedText ? cleanedText : null;
}

function splitLongText(text: string, maxChars: number, overlapChars: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const chunk = text.substring(start, end);
    chunks.push(chunk);
    if (end === text.length) break;
    start += maxChars - overlapChars;
  }

  return chunks;
}

export function chunkDocument(doc: Doc, maxChars = 1000, overlap = 150): Chunk[] {
  let chunks: Chunk[] = [];
  const lines = doc.content.split(/\r?\n/).map((l) => l.trim());
  const sections = splitIntoSections(lines);

  for (const section of sections) {
    const text = sectionToText(section);
    if (!text) continue;
    const pieces = splitLongText(text, maxChars, overlap);
    for (const piece of pieces) {
      chunks.push({
        text: piece,
        headingPath: section.headingPath,
        sourceTitle: doc.title,
        sourceRelPath: doc.relPath,
        sourceTags: doc.filetags,
      });
    }
  }

  return chunks;
}
