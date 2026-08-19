/**
 * Export routes — /api/export/*
 *
 * Two-step file download flow that avoids blob: URLs entirely.
 * Blob URLs are flagged by endpoint-security software (e.g. McAfee) because
 * the download has no HTTP response headers for the AV scanner to inspect.
 *
 * Step 1 — POST /api/export/prepare
 *   Frontend sends the raw data payload; server generates the file content,
 *   stores it under a one-time UUID token (30 s TTL), returns { token }.
 *
 * Step 2 — GET /api/export/file?token=<uuid>
 *   Browser follows a real HTTP GET (triggered by a plain <a> click).
 *   Server returns Content-Disposition: attachment with the correct MIME type.
 *   AV software sees a normal HTTP file download — no blob, no JS tricks.
 */

import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";

const router: Router = Router();

// ─── In-memory token store ────────────────────────────────────────────────────

interface ExportEntry {
  content: string; // pre-rendered file text
  filename: string;
  mime: string;
  expiresAt: number; // Unix ms
}

const pending = new Map<string, ExportEntry>();

// Sweep expired entries every 60 s; unref() so the timer doesn't block exit
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of pending.entries()) {
    if (now > entry.expiresAt) pending.delete(token);
  }
}, 60_000).unref();

// ─── RFC 4180 CSV helpers ─────────────────────────────────────────────────────

function csvField(v: unknown): string {
  const s = String(v ?? "");
  // Quote fields that contain comma, double-quote, CR, or LF
  if (
    s.includes(",") ||
    s.includes('"') ||
    s.includes("\r") ||
    s.includes("\n")
  ) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const CRLF = "\r\n"; // RFC 4180 §2 requires CRLF
  const lines: string[] = [headers.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvField).join(","));
  }
  // UTF-8 BOM (EF BB BF) — Excel on Windows needs this to auto-detect UTF-8
  // without prompting the user to run the Text Import Wizard
  return "\uFEFF" + lines.join(CRLF) + CRLF;
}

// ─── POST /api/export/prepare ─────────────────────────────────────────────────

interface CsvPrepareBody {
  kind: "csv";
  headers: string[];
  rows: unknown[][];
  filename?: string;
}

interface JsonPrepareBody {
  kind: "json";
  payload: unknown;
  filename?: string;
}

type PrepareBody = CsvPrepareBody | JsonPrepareBody;

router.post("/export/prepare", (req: Request, res: Response): void => {
  const body = req.body as PrepareBody;

  if (!body || !body.kind) {
    res.status(400).json({ error: 'Missing required field "kind".' });
    return;
  }

  let content: string;
  let filename: string;
  let mime: string;

  if (body.kind === "csv") {
    if (!Array.isArray(body.headers) || !Array.isArray(body.rows)) {
      res.status(400).json({ error: "CSV export requires headers[] and rows[]." });
      return;
    }
    content = buildCsv(body.headers, body.rows);
    filename = body.filename ?? `cansat_telemetry_${Date.now()}.csv`;
    mime = "text/csv; charset=utf-8";
  } else if (body.kind === "json") {
    if (body.payload === undefined) {
      res.status(400).json({ error: "JSON export requires a payload." });
      return;
    }
    try {
      content = JSON.stringify(body.payload, null, 2);
    } catch {
      res.status(422).json({ error: "Payload is not JSON-serialisable." });
      return;
    }
    filename = body.filename ?? `cansat_logs_${Date.now()}.json`;
    mime = "application/json; charset=utf-8";
  } else {
    res.status(400).json({ error: 'kind must be "csv" or "json".' });
    return;
  }

  const token = randomUUID();
  pending.set(token, {
    content,
    filename,
    mime,
    expiresAt: Date.now() + 30_000, // 30 s — plenty of time for the GET to follow
  });

  res.json({ token });
});

// ─── GET /api/export/file?token=<uuid> ───────────────────────────────────────

router.get("/export/file", (req: Request, res: Response): void => {
  const token = req.query["token"];

  if (!token || typeof token !== "string") {
    res.status(400).send("Missing or invalid token query parameter.");
    return;
  }

  const entry = pending.get(token);

  if (!entry) {
    res.status(404).send("Export token not found or already used. Please export again.");
    return;
  }

  if (Date.now() > entry.expiresAt) {
    pending.delete(token);
    res.status(410).send("Export token has expired. Please export again.");
    return;
  }

  // Consume the token — one-time use prevents replayed downloads
  pending.delete(token);

  // Deliver the file as a proper HTTP download.
  // Content-Disposition: attachment tells the browser to save the file rather
  // than render it inline. AV software (McAfee, etc.) inspects these headers
  // and recognises this as a legitimate server-generated file download.
  res.setHeader("Content-Type", entry.mime);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${entry.filename}"`,
  );
  res.setHeader("Cache-Control", "no-store, no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(entry.content);
});

export default router;
