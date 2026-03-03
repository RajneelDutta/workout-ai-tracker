import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { GamificationState } from "@/lib/gamification";

const RARITY_COLORS = {
  common: "border-slate-400 bg-slate-50",
  rare: "border-blue-400 bg-blue-50",
  epic: "border-purple-400 bg-purple-50",
  legendary: "border-yellow-400 bg-yellow-50",
};

export function GamificationPanel({ state }: { state: GamificationState }) {
  const [tab, setTab] = useState<"overview" | "badges" | "challenge">("overview");
  const { level, nextLevel, xp, xpProgressPercent, streak, longestStreak, badges, weeklyChallenge, recentXPGains } = state;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4" style={{ background: `linear-gradient(135deg, ${level.color}22 0%, ${level.color}08 100%)` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{level.emoji}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Level {level.level}</p>
              <p className="text-xl font-bold text-slate-800">{level.title}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">{xp.toLocaleString()}</p>
            <p className="text-xs text-slate-500">total XP</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{level.minXP.toLocaleString()} XP</span>
            {nextLevel && <span>{nextLevel.title} in {state.xpToNextLevel} XP</span>}
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: level.color }}
              initial={{ width: 0 }}
              animate={{ width: `${xpProgressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span style={{ color: level.color }}>{xpProgressPercent}%</span>
            {nextLevel && <span className="text-slate-400">{nextLevel.emoji} {nextLevel.title}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {(["overview", "badges", "challenge"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors
              ${tab === t ? "text-slate-800 border-b-2 border-slate-800" : "text-slate-400 hover:text-slate-600"}`}
          >
            {t === "overview" ? "📊 Stats" : t === "badges" ? "🏅 Badges" : "⚡ Challenge"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="p-4"
        >
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Streak */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                  <p className="text-2xl font-black text-orange-500">{streak}</p>
                  <p className="text-xs text-orange-400 font-medium">🔥 Current Streak</p>
                </div>
                <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-2xl font-black text-slate-600">{longestStreak}</p>
                  <p className="text-xs text-slate-400 font-medium">🏅 Best Streak</p>
                </div>
              </div>

              {/* Recent XP */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Recent XP</p>
                <div className="space-y-1.5">
                  {recentXPGains.slice(0, 4).map((g, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{g.emoji} {g.reason}</span>
                      <span className="font-bold text-green-600">+{g.amount}</span>
                    </div>
                  ))}
                  {recentXPGains.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-2">Log a workout to earn XP! 💪</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "badges" && (
            <div className="grid grid-cols-3 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.unlocked ? badge.description : `🔒 ${badge.description}`}
                  className={`relative rounded-xl border p-2 text-center transition-all
                    ${badge.unlocked ? RARITY_COLORS[badge.rarity] : "border-slate-200 bg-slate-50 opacity-40 grayscale"}`}
                >
                  <span className="text-2xl block">{badge.emoji}</span>
                  <p className="text-[10px] font-semibold text-slate-600 mt-0.5 leading-tight">{badge.title}</p>
                  {badge.rarity === "legendary" && badge.unlocked && (
                    <span className="absolute -top-1 -right-1 text-[10px]">✨</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "challenge" && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-4 ${weeklyChallenge.completed ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">{weeklyChallenge.emoji}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${weeklyChallenge.completed ? "bg-green-200 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                    {weeklyChallenge.completed ? "✅ Done!" : `+${weeklyChallenge.xpReward} XP`}
                  </span>
                </div>
                <p className="font-bold text-slate-800">{weeklyChallenge.title}</p>
                <p className="text-sm text-slate-500 mb-3">{weeklyChallenge.description}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span>{weeklyChallenge.progress}/{weeklyChallenge.target}</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${weeklyChallenge.completed ? "bg-green-400" : "bg-blue-400"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (weeklyChallenge.progress / weeklyChallenge.target) * 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">Resets every Monday 🗓️</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}