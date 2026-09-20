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

// daySettingsMap: { [dateStr]: { included: boolean, source: 'manual' } }
export function isDayIncluded(dateStr, daySettingsMap) {
  const override = daySettingsMap[dateStr];
  if (override) return override.included;
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
 *                counts future dates.
 * targetAllowance = eligibleDays * dailyTarget
 * spendingOnEligibleDays = sum of expenses on included dates in that range,
 *                          plus a one-time backfill amount if provided
 * spendingOnExcludedDays = sum of expenses on excluded dates in that range
 *                          (still counted in totalSpent, never in savedSoFar)
 * savedSoFar = targetAllowance - spendingOnEligibleDays
 *
 * opts.backfillAmount: a one-time lump sum representing spending before the
 *   user started using the app (only pass this for the user's starting
 *   month — the caller is responsible for zeroing it out afterward).
 * opts.startOverride: a date string ('YYYY-MM-DD') to use instead of the
 *   1st of the month as the range start (only relevant for the user's
 *   starting month, when they chose to skip backfilling).
 * opts.strictSavings: when true, savedSoFar deducts spending on EVERY day
 *   (eligible or excluded) instead of only eligible-day spending. This is
 *   the user-facing Settings toggle — default false preserves the original
 *   behavior, where excluded days (e.g. weekends someone's normally home)
 *   never touch savings. With it on, spending on an excluded day (e.g. out
 *   somewhere on a Saturday) dips into savings the same way an eligible
 *   day's spending would, rather than being "free."
 */
export function getSavedSoFar(transactions, daySettingsMap, dailyTarget, asOfDate, opts = {}) {
  const { backfillAmount = 0, startOverride = null, strictSavings = false } = opts;
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
    const included = isDayIncluded(dateStr, daySettingsMap);
    if (included) eligibleDays += 1;
    const spentThatDay = spendingByDate[dateStr] || 0;
    if (included) spendingOnEligibleDays += spentThatDay;
    else spendingOnExcludedDays += spentThatDay;
  }

  spendingOnEligibleDays += backfillAmount;

  const targetAllowance = eligibleDays * dailyTarget;
  const totalSpent = spendingOnEligibleDays + spendingOnExcludedDays;
  const savedSoFar = strictSavings
    ? targetAllowance - totalSpent
    : targetAllowance - spendingOnEligibleDays;

  return {
    monthKey,
    eligibleDays,
    targetAllowance,
    spendingOnEligibleDays,
    spendingOnExcludedDays,
    totalSpent,
    savedSoFar,
    strictSavings,
  };
}

// Counts eligible (included) days strictly AFTER `asOfDate` through the end
// of `asOfDate`'s month — i.e. "days left" for the ring's reserved segment
// and the Settings/ring days-remaining readout. Excluded days (e.g. default
// weekends) don't count, same as they don't count toward targetAllowance.
export function eligibleDaysRemaining(daySettingsMap, asOfDate) {
  const monthKey = monthKeyOf(asOfDate);
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = daysInMonth(y, m - 1);
  const asOfDay = parseLocalDate(asOfDate).getDate();

  let count = 0;
  for (let day = asOfDay + 1; day <= lastDay; day++) {
    const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
    if (isDayIncluded(dateStr, daySettingsMap)) count += 1;
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
