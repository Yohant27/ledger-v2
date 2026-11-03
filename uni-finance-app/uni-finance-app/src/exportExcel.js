import * as XLSX from "xlsx";
import { categoryLabel } from "./categories.jsx";

export function exportTransactionsToExcel(transactions, filenameLabel) {
  const rows = [...transactions]
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
    .map((t) => ({
      Date: t.date,
      Type: t.type === "income" ? "Added money" : "Expense",
      Category: categoryLabel(t.category, t.type),
      Note: t.note || "",
      "Amount (RM)": t.type === "income" ? t.amount : -t.amount,
    }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 26 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, `uni-finance-${filenameLabel}.xlsx`);
}

// Days table export: one "Days" sheet (a row per day, month-by-month) plus the
// raw "Transactions" sheet for the same months.
// blocks: [{ monthKey, rows, totals }] as built by the all-days table.
export function exportDaysToExcel(blocks, transactions, filenameLabel) {
  const dayRows = [];
  const label = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
  const statusLabel = { included: "Included", excluded: "Excluded", paused: "Paused" };
  for (const b of blocks) {
    for (const r of [...b.rows].sort((x, y) => (x.date < y.date ? -1 : 1))) {
      dayRows.push({
        Month: b.monthKey,
        Date: r.date,
        Day: label(r.date),
        Status: statusLabel[r.status],
        "Spent (RM)": r.spent,
        "Target (RM)": r.target,
        "Added (RM)": r.added,
        "Saved / Over (RM)": r.saved,
      });
    }
    if (b.totals.backfill > 0) {
      dayRows.push({ Month: b.monthKey, Date: "Before using the app", Day: "", Status: "", "Spent (RM)": b.totals.backfill, "Target (RM)": 0, "Added (RM)": 0, "Saved / Over (RM)": -b.totals.backfill });
    }
    dayRows.push({
      Month: b.monthKey, Date: "TOTAL", Day: "", Status: `${b.totals.eligibleDays} eligible days`,
      "Spent (RM)": b.totals.spent + b.totals.backfill, "Target (RM)": b.totals.target, "Added (RM)": b.totals.added, "Saved / Over (RM)": b.totals.saved,
    });
  }
  const wsDays = XLSX.utils.json_to_sheet(dayRows);
  wsDays["!cols"] = [{ wch: 9 }, { wch: 20 }, { wch: 6 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];

  const months = new Set(blocks.map((b) => b.monthKey));
  const txRows = [...transactions]
    .filter((t) => months.has(t.date.slice(0, 7)))
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
    .map((t) => ({
      Date: t.date,
      Type: t.type === "income" ? "Added money" : "Expense",
      Category: categoryLabel(t.category, t.type),
      Note: t.note || "",
      "Amount (RM)": t.type === "income" ? t.amount : -t.amount,
    }));
  const wsTx = XLSX.utils.json_to_sheet(txRows);
  wsTx["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 26 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsDays, "Days");
  XLSX.utils.book_append_sheet(wb, wsTx, "Transactions");
  XLSX.writeFile(wb, `uni-finance-days-${filenameLabel}.xlsx`);
}
