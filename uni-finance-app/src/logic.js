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

// targetPeriods: [{ start, end: 'YYYY-MM-DD' | null, target: number }]
// A holiday/trip target replaces the normal daily target on the dates it
// covers. If periods overlap, the one that started most recently wins.
export function targetPeriodFor(dateStr, targetPeriods = []) {
  let found = null;
  for (const p of targetPeriods) {
    if (dateStr >= p.start && (p.end == null || dateStr <= p.end)) {
      if (!found || p.start >= found.start) found = p;
    }
  }
  return found;
}

// Effective target + warning line for one date. The warning line scales with
// a holiday target so it keeps the same proportion as the normal settings
// (e.g. RM20 of RM25 -> 80%).
export function getDayLimits(dateStr, targetPeriods, dailyTarget, warningThreshold) {
  const period = targetPeriodFor(dateStr, targetPeriods);
  if (!period) return { target: dailyTarget, warning: warningThreshold, holiday: false };
  const ratio = dailyTarget > 0 ? warningThreshold / dailyTarget : 0.8;
  return { target: period.target, warning: Math.round(period.target * ratio * 100) / 100, holiday: true };
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
 * targetAllowance = sum of each included day's target (normally dailyTarget,
 *                   or a holiday target if one covers that day)
 * spendingOnEligibleDays = sum of expenses on included dates in that range,
 *                          plus a one-time backfill amount if provided
 * spendingOnExcludedDays = sum of expenses on excluded or paused dates
 * extraAdded = money added to savings in that range (gifts, refunds, etc.)
 * savedSoFar = targetAllowance - totalSpent + extraAdded
 *
 * Spending on excluded/paused days ALWAYS deducts from savings, and added
 * money counts on any day.
 *
 * opts.backfillAmount: one-time lump sum of spending before the user started
 *   using the app (starting month only).
 * opts.startOverride: date to use instead of the 1st of the month as the range
 *   start (starting month only, when backfill was skipped).
 * opts.pauses: semester-break pauses.
 * opts.targetPeriods: holiday/trip target periods.
 * opts.warningThreshold: needed only so getDayLimits scales sensibly.
 */
export function getSavedSoFar(transactions, daySettingsMap, dailyTarget, asOfDate, opts = {}) {
  const { backfillAmount = 0, startOverride = null, pauses = [], targetPeriods = [] } = opts;
  const monthKey = monthKeyOf(asOfDate);
  const dates = datesFromMonthStartTo(monthKey, asOfDate, startOverride);

  let eligibleDays = 0;
  let targetAllowance = 0;
  let spendingOnEligibleDays = 0;
  let spendingOnExcludedDays = 0;
  let extraAdded = 0;

  const spendingByDate = {};
  const addedByDate = {};
  for (const t of transactions) {
    if (monthKeyOf(t.date) !== monthKey) continue;
    if (t.date > asOfDate) continue; // safety: never count future entries here
    if (t.type === "expense") spendingByDate[t.date] = (spendingByDate[t.date] || 0) + t.amount;
    else if (t.type === "income") addedByDate[t.date] = (addedByDate[t.date] || 0) + t.amount;
  }

  for (const dateStr of dates) {
    const included = isDayIncluded(dateStr, daySettingsMap, pauses);
    if (included) {
      eligibleDays += 1;
      targetAllowance += targetPeriodFor(dateStr, targetPeriods)?.target ?? dailyTarget;
    }
    const spentThatDay = spendingByDate[dateStr] || 0;
    if (included) spendingOnEligibleDays += spentThatDay;
    else spendingOnExcludedDays += spentThatDay;
    extraAdded += addedByDate[dateStr] || 0;
  }

  spendingOnEligibleDays += backfillAmount;

  const totalSpent = spendingOnEligibleDays + spendingOnExcludedDays;
  const savedSoFar = targetAllowance - totalSpent + extraAdded;

  return {
    monthKey,
    eligibleDays,
    targetAllowance,
    spendingOnEligibleDays,
    spendingOnExcludedDays,
    totalSpent,
    extraAdded,
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
 *   saved (per day) = (included ? that day's target : 0) - spent + added
 *   totals.saved    = totals.target - spent - backfill + added
 *
 * opts.startOverride / opts.backfillAmount apply only to the user's starting
 * month, same as getSavedSoFar. opts.targetPeriods / opts.warningThreshold
 * give each day its own target and warning line.
 */
export function getMonthDayRows(transactions, daySettingsMap, pauses, dailyTarget, monthKey, today, opts = {}) {
  const { startOverride = null, backfillAmount = 0, targetPeriods = [], warningThreshold = dailyTarget * 0.8 } = opts;
  const [y, m] = monthKey.split("-").map(Number);
  const lastOfMonth = toDateStr(new Date(y, m, 0));
  const end = lastOfMonth < today ? lastOfMonth : today;

  const empty = { rows: [], totals: { eligibleDays: 0, spent: 0, target: 0, added: 0, backfill: 0, saved: 0 } };
  if (end < `${monthKey}-01`) return empty;

  const spentByDate = {};
  const addedByDate = {};
  const countByDate = {};
  for (const t of transactions) {
    if (monthKeyOf(t.date) !== monthKey) continue;
    countByDate[t.date] = (countByDate[t.date] || 0) + 1;
    if (t.type === "expense") spentByDate[t.date] = (spentByDate[t.date] || 0) + t.amount;
    else if (t.type === "income") addedByDate[t.date] = (addedByDate[t.date] || 0) + t.amount;
  }

  let eligibleDays = 0;
  let spent = 0;
  let added = 0;
  let target = 0;
  const rows = datesFromMonthStartTo(monthKey, end, startOverride).map((date) => {
    const included = isDayIncluded(date, daySettingsMap, pauses);
    const paused = !included && isPaused(date, pauses);
    const limits = getDayLimits(date, targetPeriods, dailyTarget, warningThreshold);
    const daySpent = spentByDate[date] || 0;
    const dayAdded = addedByDate[date] || 0;
    const dayTarget = included ? limits.target : 0;
    if (included) eligibleDays += 1;
    spent += daySpent;
    added += dayAdded;
    target += dayTarget;
    return {
      date,
      included,
      status: included ? "included" : paused ? "paused" : "excluded",
      spent: daySpent,
      added: dayAdded,
      count: countByDate[date] || 0,
      target: dayTarget,
      warning: limits.warning,
      holiday: limits.holiday,
      saved: dayTarget - daySpent + dayAdded,
    };
  });

  return {
    rows,
    totals: { eligibleDays, spent, target, added, backfill: backfillAmount, saved: target - spent - backfillAmount + added },
  };
}
