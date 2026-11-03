import Dexie from "dexie";

export const db = new Dexie("UniFinanceDB");

// transactions: every recorded expense/income
// daySettings: ONLY stores manual overrides. If a date has no row here,
// its included/excluded state falls back to the weekday/weekend default.
// settings: key-value store (dailyTarget, warningThreshold, accentTheme,
//   onboardingComplete, startDate, backfillAmount, skippedBackfill,
//   pauses: [{ start, end|null }] — semester-break pauses)
db.version(1).stores({
  transactions: "++id, type, category, date, createdAt",
  daySettings: "date",
});

db.version(2).stores({
  transactions: "++id, type, category, date, createdAt",
  daySettings: "date",
  settings: "key",
});

export default db;
