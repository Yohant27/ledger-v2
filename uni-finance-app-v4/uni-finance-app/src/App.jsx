import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Home as HomeIcon, CalendarDays, Settings as SettingsIcon, X, Pause } from "lucide-react";
import { db } from "./db.js";
import { COLORS, FONT_VOICE, FONT_UI, themeCssVars, DEFAULT_ACCENT_KEY, fmt } from "./theme.js";
import {
  getTodaySpending,
  getSavedSoFar,
  eligibleDaysRemaining,
  getDailyState,
  getDayLimits,
  isDayIncluded,
  isPaused,
  recentDatesBefore,
  todayStr,
  monthKeyOf,
} from "./logic.js";
import { DAILY_TARGET, WARNING_THRESHOLD, CURRENCY } from "./config.js";
import DailyBar from "./components/DailyBar.jsx";
import SavedSoFar from "./components/SavedSoFar.jsx";
import Toast from "./components/Toast.jsx";
import TransactionEntry from "./components/TransactionEntry.jsx";
import TodayList from "./components/TodayList.jsx";
import RecentDays from "./components/RecentDays.jsx";
import CalendarView from "./components/CalendarView.jsx";
import Settings from "./components/Settings.jsx";
import DaysTable from "./components/DaysTable.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Tutorial from "./components/Tutorial.jsx";

function settingsArrayToMap(rows) {
  const map = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState("main"); // 'main' | 'table'
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const daySettingsRows = useLiveQuery(() => db.daySettings.toArray(), []) || [];
  const settingsRows = useLiveQuery(() => db.settings.toArray(), []);

  const daySettingsMap = useMemo(() => {
    const map = {};
    for (const row of daySettingsRows) map[row.date] = row;
    return map;
  }, [daySettingsRows]);

  const settings = useMemo(() => settingsArrayToMap(settingsRows || []), [settingsRows]);
  const dailyTarget = settings.dailyTarget ?? DAILY_TARGET;
  const warningThreshold = settings.warningThreshold ?? WARNING_THRESHOLD;
  const onboardingComplete = !!settings.onboardingComplete;
  const pauses = useMemo(() => settings.pauses ?? [], [settings.pauses]);
  const targetPeriods = useMemo(() => settings.targetPeriods ?? [], [settings.targetPeriods]);
  const accentTheme = settings.accentTheme ?? DEFAULT_ACCENT_KEY;

  const today = todayStr();
  // Today's target/warning, which differ from the normal ones on a holiday.
  const todayLimits = getDayLimits(today, targetPeriods, dailyTarget, warningThreshold);
  const todaySpent = useMemo(() => getTodaySpending(transactions, today), [transactions, today]);
  const todaysTransactions = useMemo(
    () => transactions.filter((t) => t.date === today).sort((a, b) => b.createdAt - a.createdAt),
    [transactions, today]
  );

  const daysRemainingThisMonth = useMemo(
    () => eligibleDaysRemaining(daySettingsMap, today, pauses),
    [daySettingsMap, today, pauses]
  );

  const pausedToday = isPaused(today, pauses) && !isDayIncluded(today, daySettingsMap, pauses);
  const activePause = pauses.find((p) => today >= p.start && (p.end == null || today <= p.end));

  const savedData = useMemo(() => {
    const startDate = settings.startDate;
    const isStartingMonth = startDate && monthKeyOf(today) === monthKeyOf(startDate);
    const opts = { pauses, targetPeriods };
    if (isStartingMonth) {
      if (settings.skippedBackfill) {
        opts.startOverride = startDate;
      } else {
        opts.backfillAmount = settings.backfillAmount || 0;
      }
    }
    return getSavedSoFar(transactions, daySettingsMap, dailyTarget, today, opts);
  }, [transactions, daySettingsMap, dailyTarget, today, settings, pauses, targetPeriods]);

  async function addTransaction(entry) {
    const txId = await db.transactions.add({ ...entry, createdAt: Date.now() });
    setToast(buildToast(entry, txId));
  }

  // Shows a toast (from the top of the screen). `undo` makes it show an Undo button.
  function showToast(message, variant = "normal", undo) {
    setToast({ id: `${Date.now()}-${Math.random()}`, message, variant, onUndo: undo });
  }

  // Builds the in-app confirmation shown after a submit.
  function buildToast(entry, txId) {
    const amt = `${CURRENCY} ${fmt(entry.amount)}`;
    const id = `${txId}-${Date.now()}`;
    const onUndo = () => db.transactions.delete(txId);
    if (entry.type === "income") {
      return { id, onUndo, variant: "normal", message: `${amt} added to your savings` };
    }
    if (entry.date !== today) {
      const when = new Date(entry.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return { id, onUndo, variant: "normal", message: `Added ${amt} to ${when}` };
    }
    if (!isDayIncluded(today, daySettingsMap, pauses)) {
      return {
        id,
        onUndo,
        variant: "warning",
        message: `Added ${amt} · today isn't counted, so it deducts from your savings`,
      };
    }
    const newTotal = todaySpent + entry.amount;
    const state = getDailyState(newTotal, todayLimits.target, todayLimits.warning);
    if (state === "over") {
      return { id, onUndo, variant: "over", message: `Added ${amt} · ${CURRENCY} ${fmt(newTotal - todayLimits.target)} over today's target` };
    }
    return {
      id,
      onUndo,
      variant: state,
      message: `Added ${amt} · ${CURRENCY} ${fmt(todayLimits.target - newTotal)} left today`,
    };
  }

  // No browser confirm() dialog (it shows as an ugly native Android prompt).
  // Delete right away and offer Undo in the toast instead.
  async function deleteTransaction(id) {
    const tx = await db.transactions.get(id);
    await db.transactions.delete(id);
    if (tx) {
      showToast(`Deleted ${tx.type === "income" ? "+" : ""}${CURRENCY} ${fmt(tx.amount)}`, "warning", () => db.transactions.put(tx));
    }
  }

  async function toggleDay(dateStr, included) {
    await db.daySettings.put({ date: dateStr, included, source: "manual" });
  }

  async function setRangeDay(dates, preset) {
    if (preset === "weekdays") {
      await db.daySettings.bulkDelete(dates);
    } else {
      const included = preset === "all";
      await db.daySettings.bulkPut(dates.map((date) => ({ date, included, source: "manual" })));
    }
  }

  async function completeOnboarding({ backfillAmount, skipped }) {
    await db.settings.bulkPut([
      { key: "dailyTarget", value: DAILY_TARGET },
      { key: "warningThreshold", value: WARNING_THRESHOLD },
      { key: "onboardingComplete", value: true },
      { key: "startDate", value: todayStr() },
      { key: "backfillAmount", value: backfillAmount || 0 },
      { key: "skippedBackfill", value: !!skipped },
    ]);
  }

  async function saveTargets({ dailyTarget: t, warningThreshold: w }) {
    await db.settings.bulkPut([
      { key: "dailyTarget", value: t },
      { key: "warningThreshold", value: w },
    ]);
  }

  async function savePauses(next) {
    const sorted = [...next].sort((a, b) => (a.start < b.start ? -1 : 1));
    await db.settings.put({ key: "pauses", value: sorted });
  }

  async function addPause({ start, end }) {
    // Clear older manual per-day overrides inside the pause so the whole range
    // is paused; days can still be force-counted afterward from the Days tab.
    const clearTo = end && end < today ? end : today;
    if (start <= clearTo) {
      await db.daySettings.where("date").between(start, clearTo, true, true).delete();
    }
    await savePauses([...pauses, { start, end }]);
  }

  async function endPause(index) {
    const p = pauses[index];
    if (!p) return;
    if (p.start >= today) {
      await savePauses(pauses.filter((_, i) => i !== index));
    } else {
      const yesterday = recentDatesBefore(today, 1)[0];
      await savePauses(pauses.map((x, i) => (i === index ? { ...x, end: yesterday } : x)));
    }
  }

  async function removePause(index) {
    const before = pauses;
    await savePauses(pauses.filter((_, i) => i !== index));
    showToast("Pause removed — those days count again", "warning", () => savePauses(before));
  }

  async function saveTargetPeriods(next) {
    const sorted = [...next].sort((a, b) => (a.start < b.start ? -1 : 1));
    await db.settings.put({ key: "targetPeriods", value: sorted });
  }

  async function addTargetPeriod({ start, end, target }) {
    await saveTargetPeriods([...targetPeriods, { start, end, target }]);
    showToast(`Holiday target set: ${CURRENCY} ${fmt(target)}/day`);
  }

  async function endTargetPeriod(index) {
    const p = targetPeriods[index];
    if (!p) return;
    if (p.start >= today) {
      await saveTargetPeriods(targetPeriods.filter((_, i) => i !== index));
    } else {
      const yesterday = recentDatesBefore(today, 1)[0];
      await saveTargetPeriods(targetPeriods.map((x, i) => (i === index ? { ...x, end: yesterday } : x)));
    }
  }

  async function removeTargetPeriod(index) {
    const before = targetPeriods;
    await saveTargetPeriods(targetPeriods.filter((_, i) => i !== index));
    showToast("Holiday target removed", "warning", () => saveTargetPeriods(before));
  }

  async function completeOnboarding({ backfillAmount, skipped }) {
    await db.settings.bulkPut([
      { key: "dailyTarget", value: DAILY_TARGET },
      { key: "warningThreshold", value: WARNING_THRESHOLD },
      { key: "onboardingComplete", value: true },
      { key: "startDate", value: todayStr() },
      { key: "backfillAmount", value: backfillAmount || 0 },
      { key: "skippedBackfill", value: !!skipped },
    ]);
  }

  async function saveTargets({ dailyTarget: t, warningThreshold: w }) {
    await db.settings.bulkPut([
      { key: "dailyTarget", value: t },
      { key: "warningThreshold", value: w },
    ]);
  }

  async function savePauses(next) {
    const sorted = [...next].sort((a, b) => (a.start < b.start ? -1 : 1));
    await db.settings.put({ key: "pauses", value: sorted });
  }

  async function addPause({ start, end }) {
    // Clear older manual per-day overrides inside the pause so the whole range
    // is paused; days can still be force-counted afterward from the Days tab.
    const clearTo = end && end < today ? end : today;
    if (start <= clearTo) {
      await db.daySettings.where("date").between(start, clearTo, true, true).delete();
    }
    await savePauses([...pauses, { start, end }]);
  }

  async function endPause(index) {
    const p = pauses[index];
    if (!p) return;
    if (p.start >= today) {
      await savePauses(pauses.filter((_, i) => i !== index));
    } else {
      const yesterday = recentDatesBefore(today, 1)[0];
      await savePauses(pauses.map((x, i) => (i === index ? { ...x, end: yesterday } : x)));
    }
  }

  async function removePause(index) {
    await savePauses(pauses.filter((_, i) => i !== index));
  }

  async function setAccentTheme(key) {
    await db.settings.put({ key: "accentTheme", value: key });
  }

  async function deleteAllData() {
    await db.transaction("rw", db.transactions, db.daySettings, db.settings, async () => {
      await db.transactions.clear();
      await db.daySettings.clear();
      await db.settings.clear();
    });
    setScreen("main");
    setTab("home");
  }

  const dateHeader = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" }).toUpperCase();

  // Still loading settings from IndexedDB — avoid flashing onboarding before we know
  if (settingsRows === undefined) return null;

  return (
    <div
      style={{
        fontFamily: FONT_UI,
        background: COLORS.ink,
        minHeight: "100vh",
        padding: "28px 14px 90px",
        display: "flex",
        justifyContent: "center",
        ...themeCssVars(accentTheme),
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .uf-card { width: 100%; max-width: 420px; }
        @keyframes uf-toast-in { from { transform: translateY(-14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        input::placeholder { color: rgba(var(--uf-ink-rgb),0.4); }
      `}</style>

      <div className="uf-card">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontFamily: FONT_VOICE, fontSize: 15, color: COLORS.paper, letterSpacing: "0.02em" }}>
            Uni Finance
          </span>
          <span style={{ fontFamily: FONT_UI, fontSize: 12, color: "rgba(237,239,231,0.5)" }}>{dateHeader}</span>
        </div>

        <div
          style={{
            background: COLORS.paper,
            borderRadius: 6,
            border: "1px solid rgba(var(--uf-ink-rgb),0.5)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
            overflow: "hidden",
          }}
        >
          {!onboardingComplete ? (
            <Onboarding onComplete={completeOnboarding} />
          ) : tutorialOpen ? (
            <div style={{ padding: "22px 22px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <button onClick={() => setTutorialOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "rgba(var(--uf-ink-rgb),0.5)" }}>
                  <X size={16} />
                </button>
              </div>
              <Tutorial finishLabel="Got it" onFinish={() => setTutorialOpen(false)} />
            </div>
          ) : screen === "table" ? (
            <div style={{ padding: "20px 22px" }}>
              <DaysTable
                transactions={transactions}
                daySettingsMap={daySettingsMap}
                pauses={pauses}
                targetPeriods={targetPeriods}
                dailyTarget={dailyTarget}
                warningThreshold={warningThreshold}
                settings={settings}
                today={today}
                onDelete={deleteTransaction}
                onBack={() => setScreen("main")}
              />
            </div>
          ) : tab === "home" ? (
            <>
              {pausedToday && activePause && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 22px", background: "rgba(var(--uf-ink-rgb),0.08)", borderBottom: `1px solid ${COLORS.line}` }}>
                  <Pause size={14} color={COLORS.ink} style={{ flex: "none" }} />
                  <div style={{ flex: 1, fontSize: 12, color: COLORS.ink, fontFamily: FONT_UI, lineHeight: 1.4 }}>
                    On break — today isn't counted toward your target.
                  </div>
                  <button
                    onClick={() => endPause(pauses.indexOf(activePause))}
                    style={{ border: "none", background: COLORS.ink, color: COLORS.paper, fontFamily: FONT_UI, fontSize: 12, borderRadius: 4, padding: "6px 10px", cursor: "pointer", flex: "none" }}
                  >
                    Resume
                  </button>
                </div>
              )}
              <div style={{ padding: "22px 22px 18px", borderBottom: `1px solid ${COLORS.line}` }}>
                <TransactionEntry onAdd={addTransaction} />
              </div>

              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.line}` }}>
                <DailyBar todaySpent={todaySpent} dailyTarget={todayLimits.target} warningThreshold={todayLimits.warning} holiday={todayLimits.holiday} />
              </div>

              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.line}` }}>
                <SavedSoFar data={savedData} daysRemaining={daysRemainingThisMonth} />
              </div>

              <div style={{ padding: "14px 22px", borderBottom: `1px solid ${COLORS.line}` }}>
                <div style={{ fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.5)", marginBottom: 4, fontFamily: FONT_UI }}>
                  Today's entries
                </div>
                <TodayList transactions={todaysTransactions} onDelete={deleteTransaction} />
              </div>

              <div style={{ padding: "14px 22px" }}>
                <div style={{ fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.5)", marginBottom: 4, fontFamily: FONT_UI }}>
                  Recent days
                </div>
                <RecentDays
                  transactions={transactions}
                  daySettingsMap={daySettingsMap}
                  pauses={pauses}
                  targetPeriods={targetPeriods}
                  today={today}
                  onDelete={deleteTransaction}
                  dailyTarget={dailyTarget}
                  warningThreshold={warningThreshold}
                />
              </div>
            </>
          ) : tab === "calendar" ? (
            <div style={{ padding: "20px 22px" }}>
              <CalendarView daySettingsMap={daySettingsMap} pauses={pauses} onToggleDay={toggleDay} onSetRange={setRangeDay} />
            </div>
          ) : (
            <div style={{ padding: "20px 22px" }}>
              <Settings
                dailyTarget={dailyTarget}
                warningThreshold={warningThreshold}
                onSaveTargets={saveTargets}
                pauses={pauses}
                today={today}
                onAddPause={addPause}
                onEndPause={endPause}
                onRemovePause={removePause}
                targetPeriods={targetPeriods}
                onAddPeriod={addTargetPeriod}
                onEndPeriod={endTargetPeriod}
                onRemovePeriod={removeTargetPeriod}
                accentTheme={accentTheme}
                onSetAccentTheme={setAccentTheme}
                onOpenTable={() => setScreen("table")}
                onReplayTutorial={() => setTutorialOpen(true)}
                onDeleteAll={deleteAllData}
              />
            </div>
          )}
        </div>

        <Toast toast={toast} onDismiss={() => setToast(null)} />

        {onboardingComplete && !tutorialOpen && screen === "main" && (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <NavButton active={tab === "home"} onClick={() => setTab("home")} icon={HomeIcon} label="Home" />
            <NavButton active={tab === "calendar"} onClick={() => setTab("calendar")} icon={CalendarDays} label="Days" />
            <NavButton active={tab === "settings"} onClick={() => setTab("settings")} icon={SettingsIcon} label="Settings" />
          </div>
        )}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 0",
        borderRadius: 6,
        border: `1px solid ${active ? "rgba(201,138,62,0.5)" : "rgba(237,239,231,0.15)"}`,
        background: active ? "rgba(201,138,62,0.12)" : "transparent",
        color: active ? "#EFC988" : "rgba(237,239,231,0.5)",
        fontFamily: FONT_UI,
        fontSize: 12.5,
        cursor: "pointer",
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
