import * as XLSX from "xlsx";
import { categoryLabel } from "./categories.jsx";

export function exportTransactionsToExcel(transactions, filenameLabel) {
  const rows = [...transactions]
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
    .map((t) => ({
      Date: t.date,
      Type: t.type === "income" ? "Income" : "Expense",
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
