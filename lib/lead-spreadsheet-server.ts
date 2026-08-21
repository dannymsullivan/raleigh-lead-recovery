import "server-only";

import { parseCsvRows, type SpreadsheetData } from "./lead-import";

function uniqueHeaders(values: string[]): string[] {
  const counts = new Map<string, number>();
  return values.map((value, index) => {
    const base = value.trim() || `Column ${index + 1}`;
    const next = (counts.get(base) ?? 0) + 1;
    counts.set(base, next);
    return next === 1 ? base : `${base} (${next})`;
  });
}

function stringCell(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export async function parseLeadSpreadsheet(file: File, maxRows = 25_000): Promise<SpreadsheetData> {
  const lowerName = file.name.toLowerCase();
  let matrix: string[][];
  if (lowerName.endsWith(".csv") || file.type === "text/csv") {
    matrix = parseCsvRows(new TextDecoder("utf-8").decode(await file.arrayBuffer()).replace(/^\uFEFF/, ""));
  } else if (lowerName.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/node");
    const sheet = await readSheet(Buffer.from(await file.arrayBuffer()));
    matrix = sheet.map((row) => row.map(stringCell));
  } else {
    throw new Error("Upload a CSV or XLSX file.");
  }
  if (!matrix.length) throw new Error("This spreadsheet is empty.");
  const headers = uniqueHeaders(matrix[0]);
  const allRows = matrix.slice(1).filter((row) => row.some((value) => value.trim()));
  return { headers, rows: allRows.slice(0, maxRows), totalRows: allRows.length, truncated: allRows.length > maxRows };
}
