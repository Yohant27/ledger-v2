import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Home as HomeIcon, CalendarDays, Settings as SettingsIcon, X } from "lucide-react";
import { db } from "./db.js";
import { COLORS, FONT_VOICE, FONT_UI, themeCssVars, DEFAULT_ACCENT_KEY } from "./theme.js";
import { getTodaySpending, getSavedSoFar, eligibleDaysRemaining, todayStr, monthKeyOf } from "./logic.js";
import { DAILY_TARGET, WARNING_THRESHOLD, DEFAULT_STRICT_SAVINGS } from "./config.js";
import DailyBar from "./components/DailyBar.jsx";
import SavedSoFar from "./components/SavedSoFar.jsx";
import ProgressRing from "./components/ProgressRing.jsx";
import TransactionEntry from "./components/TransactionEntry.jsx";
import TodayList from "./components/TodayList.jsx";
import RecentDays from "./components/RecentDays.jsx";
import CalendarView from "./components/CalendarView.jsx";
import Settings from "./components/Settings.jsx";
import MonthTransactions from "./components/MonthTransactions.jsx";
import PreviousMonths from "./components/PreviousMonths.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Tutorial from "./components/Tutorial.jsx";

function settingsArrayToMap(rows) {
  const map = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState("main"); // 'main' | 'month' | 'previousMonths'
  const [tutorialOpen, setTutorialOpen] = useState(false);

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
  const strictSavings = settings.strictSavings ?? DEFAULT_STRICT_SAVINGS;
  const accentTheme = settings.accentTheme ?? DEFAULT_ACCENT_KEY;

  const today = todayStr();
  const todaySpent = useMemo(() => getTodaySpending(transactions, today), [transactions, today]);
  const todaysTransactions = useMemo(
    () => transactions.filter((t) => t.date === today).sort((a, b) => b.createdAt - a.createdAt),
    [transactions, today]
  );

  const daysRemainingThisMonth = useMemo(
    () => eligibleDaysRemaining(daySettingsMap, today),
    [daySettingsMap, today]
  );

  const savedData = useMemo(() => {
    const startDate = settings.startDate;
    const isStartingMonth = startDate && monthKeyOf(today) === monthKeyOf(startDate);
    const opts = { strictSavings };
    if (isStartingMonth) {
      if (settings.skippedBackfill) {
        opts.startOverride = startDate;
      } else {
        opts.backfillAmount = settings.backfillAmount || 0;
      }
    }
    return getSavedSoFar(transactions, daySettingsMap, dailyTarget, today, opts);
  }, [transactions, daySettingsMap, dailyTarget, today, settings, strictSavings]);

  async function addTransaction(entry) {
    await db.transactions.add({ ...entry, createdAt: Date.now() });
  }

  async function deleteTransaction(id) {
    await db.transactions.delete(id);
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

  async function setStrictSavings(value) {
    await db.settings.put({ key: "strictSavings", value });
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
        input::placeholder { color: rgba(var(--uf-ink-rgb),0.4); }
      `}</style>

      <div className="uf-card">
        {onboardingComplete && !tutorialOpen && screen === "main" && (
          <div style={{ marginBottom: 14 }}>
            <ProgressRing savedData={savedData} daysRemaining={daysRemainingThisMonth} dailyTarget={dailyTarget} />
          </div>
        )}

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
          ) : screen === "month" ? (
            <div style={{ padding: "20px 22px" }}>
              <MonthTransactions transactions={transactions} onDelete={deleteTransaction} onBack={() => setScreen("main")} />
            </div>
          ) : screen === "previousMonths" ? (
            <div style={{ padding: "20px 22px" }}>
              <PreviousMonths transactions={transactions} onDelete={deleteTransaction} onBack={() => setScreen("main")} />
            </div>
          ) : tab === "home" ? (
            <>
              <div style={{ padding: "22px 22px 18px", borderBottom: `1px solid ${COLORS.line}` }}>
                <TransactionEntry onAdd={addTransaction} />
              </div>

              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.line}` }}>
                <DailyBar todaySpent={todaySpent} dailyTarget={dailyTarget} warningThreshold={warningThreshold} />
              </div>

              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.line}` }}>
                <SavedSoFar data={savedData} />
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
                  today={today}
                  onDelete={deleteTransaction}
                  dailyTarget={dailyTarget}
                  warningThreshold={warningThreshold}
                />
              </div>
            </>
          ) : tab === "calendar" ? (
            <div style={{ padding: "20px 22px" }}>
              <CalendarView daySettingsMap={daySettingsMap} onToggleDay={toggleDay} onSetRange={setRangeDay} />
            </div>
          ) : (
            <div style={{ padding: "20px 22px" }}>
              <Settings
                dailyTarget={dailyTarget}
                warningThreshold={warningThreshold}
                onSaveTargets={saveTargets}
                strictSavings={strictSavings}
                onToggleStrictSavings={setStrictSavings}
                accentTheme={accentTheme}
                onSetAccentTheme={setAccentTheme}
                onOpenMonth={() => setScreen("month")}
                onOpenPreviousMonths={() => setScreen("previousMonths")}
                onReplayTutorial={() => setTutorialOpen(true)}
                onDeleteAll={deleteAllData}
              />
            </div>
          )}
        </div>

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
