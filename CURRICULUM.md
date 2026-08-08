# Curriculum: first AI agent (local RAG over orgfiles)

Teaching mode: Socratic.
Claude explains concepts and defines exercise contracts.
The student writes the implementation.
Claude reviews.

## Stack

- Runtime: Bun + TypeScript.
- Orchestration: Vercel AI SDK (`ai`).
- Local models: Ollama (`ollama-ai-provider-v2`).
  Chat models available: `llama3.1:8b`, `qwen2.5-coder:7b`, `qwen2.5-coder:14b`, `gemma3:4b`.
  Embedding model: `nomic-embed-text` (to be pulled).
- Vector store (v1): in-memory array + JSON file persistence, cosine similarity computed by hand.
- Evals: lmnr (Laminar).
  Self-hosted vs. cloud decision pending - vault contains personal/financial notes (`02_areas/finance`, `06_journal`).

## Source content

Path: `/Users/rigoroserocastillo/Documents/orgfiles` (read from `ORGFILES_PATH` in `.env`, see `src/config.ts`).
Format: Org-mode (`.org`), org-roam vault, PARA method.
Each file has a `:PROPERTIES: :ID: :END:` drawer, `#+title:`, `#+filetags:`.
Headings use `*`, `**`, `***` outline levels, not Markdown `#`.
The folder is its own nested git repo - exclude `.git/*` from ingestion.

## Project scaffold

```
rigo-agi-orgfiles/
  index.ts              # entry point (CLI or Bun.serve) - Lesson 8
  src/
    config.ts            # env/config plumbing (done)
    ingest.ts             # Lesson 1
    chunk.ts              # Lesson 2
    embed.ts              # Lesson 3
    store.ts              # Lesson 4
    retrieve.ts            # Lesson 5
    agent/
      prompt.ts            # system prompt + context formatting - Lesson 6
      chat.ts               # streamText wiring, citation extraction - Lesson 6
    evals/
      dataset.ts            # eval question set - Lesson 7
      retrieval.eval.ts      # retrieval quality (hit-rate/MRR) - Lesson 7
      generation.eval.ts     # answer faithfulness/citation correctness - Lesson 7
  data/                  # persisted vector store JSON (gitignored, contains embedded personal notes)
  .env                   # ORGFILES_PATH (gitignored)
```

`src/agent/` is separated from the pipeline files because it may later become agentic (retrieval as a tool the model calls) without touching ingestion/chunking/embedding/storage.

## Lessons

1. **Ingestion** - walk the vault, exclude `.git`, filter `.org` files, read with `Bun.file`, parse `#+title:`/`#+filetags:`.
   Status: done. `src/ingest.ts` exports `discoverEntries` and `loadOrgFiles`, returning `Doc[]` (`path`, `relPath`, `title`, `filetags`, `content`). Verified against all 18 real files.
2. **Chunking** - split org documents into retrievable units, aware of outline levels and PROPERTIES drawers, with overlap and per-chunk metadata (heading path, source file).
   Status: done. `src/chunk.ts` exports `Chunk`/`Section`/`HeadingType` types and `chunkDocument(doc, maxChars=1000, overlap=150)`. Splits by org outline level with stack-tracked heading ancestry, strips `:PROPERTIES:...:END:` drawers and `#+keyword:` lines, drops empty sections, sub-splits oversized sections with overlap. Verified end-to-end: 18 docs → 257 chunks.
3. **Embeddings** - pull `nomic-embed-text`, add `ollama-ai-provider-v2`, generate vectors via AI SDK's `embedMany`.
   Status: done. `src/embed.ts` exports `EmbbededChunk` (`Chunk & { embedding: number[] }`, note: typo'd name, harmless) and `embedChunks(chunks)`, batching via `embedMany`. Verified against all 257 real chunks - 768-dim vectors, ~6.7s total, fully local via Ollama. Removed unused `@ai-sdk/openai` dependency (was installed by mistake following generic Vercel AI SDK docs).
4. **Vector store** - persist `{vector, text, metadata}` to JSON via `Bun.write`, implement cosine similarity by hand.
   Status: done. `src/store.ts` exports `saveStore`/`loadStore` (via `Bun.write`/`Bun.file().json()`) and `dotProduct`/`magnitud`/`cosineSimilarity`. Verified against all 257 real embedded chunks: save/load round-trips exactly, self-similarity = 1, cross-topic (finance vs. aws) similarity = 0.40.
5. **Retrieval** - embed the query, rank chunks by cosine similarity, return top-k with metadata.
   Status: in progress (current lesson).
6. **Evals (lmnr)** - build an eval dataset grounded in real vault content, and the lmnr evaluate() scoring harness, BEFORE the tools/agent exist.
   This defines target behavior (expected facts/citations per question) independently of any implementation, so the eval bar doesn't quietly bend to match whatever gets built - same instinct as test-driven development, applied to agent behavior.
   Privacy decision (self-host vs. cloud Laminar) must be made before this lesson sends any data out.
   Status: pending.
7. **Tools** - wrap retrieval (Lesson 5) as a Vercel AI SDK `tool()` the model can call by itself, rather than something we always pre-fetch for it.
   This is what turns naive RAG (we retrieve, then generate) into agentic RAG (the model decides when and how to search, possibly more than once).
   Status: pending.
8. **Generation + citations (agentic)** - wire the Lesson 7 tool into a real tool-calling loop (`streamText`/`generateText` with `tools` + multi-step calling), generate answers that cite source file/heading, then run the Lesson 6 evals against this real implementation.
   Status: pending.
9. **Chat interface** - wrap the pipeline in a usable chat loop (CLI stdin or minimal `Bun.serve` + HTML).
   Status: pending.
