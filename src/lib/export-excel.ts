/**
 * A single export column: a header plus how to pull its cell value from a row.
 * `value` returns the raw cell — keep numbers as numbers so Excel treats them
 * as numeric, and format only strings (dates, labels) that must read a set way.
 */
export interface ExcelColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

interface PageMeta {
  current_page?: number;
  last_page?: number;
}

/**
 * Walks a paginated listing to the end so an export covers every matching row,
 * not just the page on screen. Capped so a misreported `last_page` cannot spin
 * forever.
 */
export async function collectAllPages<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; pagination?: PageMeta | null }>,
  maxPages = 200,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const res = await fetchPage(page);
    all.push(...(res.data ?? []));
    lastPage = res.pagination?.last_page ?? page;
    page += 1;
  } while (page <= lastPage && page <= maxPages);
  return all;
}

const stampName = (base: string) => {
  const date = new Date().toISOString().slice(0, 10);
  const safe = base
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${safe || "export"}-${date}.xlsx`;
};

/** Widen each column to the longest cell so nothing is clipped on open. */
const autoWidth = <T>(columns: ExcelColumn<T>[], rows: T[]) =>
  columns.map((col) => {
    const longest = rows.reduce((max, row) => {
      const v = col.value(row);
      return Math.max(max, v == null ? 0 : String(v).length);
    }, col.header.length);
    return { wch: Math.min(Math.max(longest + 2, 10), 60) };
  });

/**
 * Builds an .xlsx from typed columns and triggers a download. Runs entirely in
 * the browser — no export endpoint needed — so it captures exactly the rows the
 * page is currently showing.
 */
export async function exportToExcel<T>(options: {
  filename: string;
  columns: ExcelColumn<T>[];
  rows: T[];
  sheetName?: string;
}) {
  const { filename, columns, rows, sheetName = "Sheet1" } = options;

  // Loaded on demand — SheetJS is ~400KB and only needed the moment someone
  // actually downloads, so it stays out of every page's initial bundle.
  const XLSX = await import("xlsx");

  const aoa = [
    columns.map((c) => c.header),
    ...rows.map((row) =>
      columns.map((c) => {
        const v = c.value(row);
        return v === undefined ? null : v;
      }),
    ),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = autoWidth(columns, rows);

  const book = XLSX.utils.book_new();
  // Excel caps sheet names at 31 chars and forbids a handful of characters.
  const safeSheet = sheetName.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
  XLSX.utils.book_append_sheet(book, sheet, safeSheet);

  XLSX.writeFile(book, stampName(filename));
}
