// All date strings in this file are 'YYYY-MM-DD', always in LOCAL time
// (never UTC) so day boundaries match the user's actual calendar day.

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function monthKeyOf(dateStr) {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isWeekend(dateStr) {
  const day = parseLocalDate(dateStr).getDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
}

export function defaultIncluded(dateStr) {
  return !isWeekend(dateStr);
}

// pauses: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' | null }]  (end null = still paused)
export function isPaused(dateStr, pauses = []) {
  return pauses.some((p) => dateStr >= p.start && (p.end == null || dateStr <= p.end));
}

// daySettingsMap: { [dateStr]: { included: boolean, source: 'manual' } }
// Precedence: a manual per-day override always wins; otherwise a paused day
// (semester break) is excluded; otherwise weekdays are in and weekends are out.
export function isDayIncluded(dateStr, daySettingsMap, pauses = []) {
  const override = daySettingsMap[dateStr];
  if (override) return override.included;
  if (isPaused(dateStr, pauses)) return false;
  return defaultIncluded(dateStr);
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Returns every date string from the 1st of the month through `endDateStr`
// (inclusive), or from `startOverrideDateStr` if it's later than the 1st
// (used for a user's first month, so days before they started using the
// app never count toward the target). Never goes past today.
export function datesFromMonthStartTo(monthKey, endDateStr, startOverrideDateStr) {
  const [y, m] = monthKey.split("-").map(Number);
  let start = new Date(y, m - 1, 1);
  if (startOverrideDateStr) {
    const so = parseLocalDate(startOverrideDateStr);
    if (so > start) start = so;
  }
  const end = parseLocalDate(endDateStr);
  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(toDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function getTodaySpending(transactions, dateStr) {
  return transactions
    .filter((t) => t.type === "expense" && t.date === dateStr)
    .reduce((sum, t) => sum + t.amount, 0);
}

// Returns the last `count` calendar dates strictly BEFORE `beforeDateStr`,
// most recent first (e.g. yesterday, the day before, ...).
export function recentDatesBefore(beforeDateStr, count) {
  const dates = [];
  const cursor = parseLocalDate(beforeDateStr);
  for (let i = 0; i < count; i++) {
    cursor.setDate(cursor.getDate() - 1);
    dates.push(toDateStr(cursor));
  }
  return dates;
}

/**
 * Core "saved so far" calculation.
 *
 * eligibleDays = count of included dates from the 1st of the month (or the
 *                user's start date, if this is their first month and they
 *                skipped backfilling) through `asOfDate`, inclusive. Never
 *                counts future dates. Paused days (semester breaks) are not
 *                included unless manually overridden.
 * targetAllowance = eligibleDays * dailyTarget
 * spendingOnEligibleDays = sum of expenses on included dates in that range,
 *                          plus a one-time backfill amount if provided
 * spendingOnExcludedDays = sum of expenses on excluded or paused dates
 * savedSoFar = targetAllowance - (spendingOnEligibleDays + spendingOnExcludedDays)
 *
 * Spending on excluded/paused days ALWAYS deducts from savings: a day that
 * doesn't earn an allowance still costs money when you spend on it.
 *
 * opts.backfillAmount: a one-time lump sum representing spending before the
 *   user started using the app (only for the user's starting month).
 * opts.startOverride: a date string to use instead of the 1st of the month
 *   as the range start (only for the starting month, when backfill was skipped).
 * opts.pauses: the list of semester-break pauses.
 */
export function getSavedSoFar(transactions, daySettingsMap, dailyTarget, asOfDate, opts = {}) {
  const { backfillAmount = 0, startOverride = null, pauses = [] } = opts;
  const monthKey = monthKeyOf(asOfDate);
  const dates = datesFromMonthStartTo(monthKey, asOfDate, startOverride);

  let eligibleDays = 0;
  let spendingOnEligibleDays = 0;
  let spendingOnExcludedDays = 0;

  const spendingByDate = {};
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (monthKeyOf(t.date) !== monthKey) continue;
    if (t.date > asOfDate) continue; // safety: never count future spending here
    spendingByDate[t.date] = (spendingByDate[t.date] || 0) + t.amount;
  }

  for (const dateStr of dates) {
    const included = isDayIncluded(dateStr, daySettingsMap, pauses);
    if (included) eligibleDays += 1;
    const spentThatDay = spendingByDate[dateStr] || 0;
    if (included) spendingOnEligibleDays += spentThatDay;
    else spendingOnExcludedDays += spentThatDay;
  }

  spendingOnEligibleDays += backfillAmount;

  const targetAllowance = eligibleDays * dailyTarget;
  const totalSpent = spendingOnEligibleDays + spendingOnExcludedDays;
  const savedSoFar = targetAllowance - totalSpent;

  return {
    monthKey,
    eligibleDays,
    targetAllowance,
    spendingOnEligibleDays,
    spendingOnExcludedDays,
    totalSpent,
    savedSoFar,
  };
}

// Counts eligible (included) days strictly AFTER `asOfDate` through the end
// of `asOfDate`'s month — the "days left" readout. Excluded days (default
// weekends) and paused days don't count, same as they don't count toward
// targetAllowance.
export function eligibleDaysRemaining(daySettingsMap, asOfDate, pauses = []) {
  const monthKey = monthKeyOf(asOfDate);
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = daysInMonth(y, m - 1);
  const asOfDay = parseLocalDate(asOfDate).getDate();

  let count = 0;
  for (let day = asOfDay + 1; day <= lastDay; day++) {
    const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
    if (isDayIncluded(dateStr, daySettingsMap, pauses)) count += 1;
  }
  return count;
}

export function getDailyState(todaySpent, dailyTarget, warningThreshold) {
  if (todaySpent >= dailyTarget) return "over";
  if (todaySpent >= warningThreshold) return "warning";
  return "normal";
}

// Simple totals for a given month, used by the Previous Months view.
// Deliberately does not reconstruct historical saved-so-far — that would
// need full historical daySettings context and isn't worth the complexity
// for a past-months summary.
export function getMonthSummary(transactions, monthKey) {
  const monthTxns = transactions.filter((t) => monthKeyOf(t.date) === monthKey);
  const totalSpent = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const byCategory = {};
  for (const t of monthTxns) {
    if (t.type !== "expense") continue;
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  }
  let topCategory = null;
  let topAmount = 0;
  for (const [cat, amt] of Object.entries(byCategory)) {
    if (amt > topAmount) { topCategory = cat; topAmount = amt; }
  }
  return {
    monthKey,
    totalSpent,
    totalIncome,
    net: totalIncome - totalSpent,
    transactionCount: monthTxns.length,
    topCategory,
    topCategoryAmount: topAmount,
    transactions: monthTxns,
  };
}

// Returns every distinct month key present in the transaction history,
// most recent first.
export function allMonthKeysDescending(transactions) {
  const keys = new Set(transactions.map((t) => monthKeyOf(t.date)));
  return [...keys].sort().reverse();
}

// Every month that should appear in the all-days table, most recent first:
// the current month, the month the user started, and any month with a
// transaction.
export function tableMonthKeys(transactions, startDate, today) {
  const keys = new Set([monthKeyOf(today)]);
  if (startDate) keys.add(monthKeyOf(startDate));
  for (const t of transactions) keys.add(monthKeyOf(t.date));
  return [...keys].sort().reverse();
}

/**
 * One row per day of `monthKey` (through today at most) for the all-days
 * table. Mirrors getSavedSoFar exactly so a month's totals match the Home
 * screen's "saved so far":
 *   saved (per day) = included ? target - spent : -spent
 *   totals.saved    = eligibleDays * target - spent - backfill
 *
 * opts.startOverride / opts.backfillAmount apply only to the user's starting
 * month, same as getSavedSoFar.
 */
export function getMonthDayRows(transactions, daySettingsMap, pauses, dailyTarget, monthKey, today, opts = {}) {
  const { startOverride = null, backfillAmount = 0 } = opts;
  const [y, m] = monthKey.split("-").map(Number);
  const lastOfMonth = toDateStr(new Date(y, m, 0));
  const end = lastOfMonth < today ? lastOfMonth : today;

  const empty = { rows: [], totals: { eligibleDays: 0, spent: 0, target: 0, backfill: 0, saved: 0 } };
  if (end < `${monthKey}-01`) return empty;

  const spentByDate = {};
  const countByDate = {};
  for (const t of transactions) {
    if (monthKeyOf(t.date) !== monthKey) continue;
    countByDate[t.date] = (countByDate[t.date] || 0) + 1;
    if (t.type === "expense") spentByDate[t.date] = (spentByDate[t.date] || 0) + t.amount;
  }

  let eligibleDays = 0;
  let spent = 0;
  const rows = datesFromMonthStartTo(monthKey, end, startOverride).map((date) => {
    const included = isDayIncluded(date, daySettingsMap, pauses);
    const paused = !included && isPaused(date, pauses);
    const daySpent = spentByDate[date] || 0;
    if (included) eligibleDays += 1;
    spent += daySpent;
    return {
      date,
      included,
      status: included ? "included" : paused ? "paused" : "excluded",
      spent: daySpent,
      count: countByDate[date] || 0,
      target: included ? dailyTarget : 0,
      saved: (included ? dailyTarget : 0) - daySpent,
    };
  });

  const target = eligibleDays * dailyTarget;
  return {
    rows,
    totals: { eligibleDays, spent, target, backfill: backfillAmount, saved: target - spent - backfillAmount },
  };
}
