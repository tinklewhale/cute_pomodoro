import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGameStore, type SessionRecord } from '../../features/game/useGameStore';
import { ACHIEVEMENTS, type AchievementDefinition } from '../../data/items';

// ── Helpers ────────────────────────────────────────────────

function getSessionsPerDay(
  sessionHistory: SessionRecord[],
  month: Date
): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessionHistory) {
    if (s.date.startsWith(format(month, 'yyyy-MM'))) {
      map.set(s.date, (map.get(s.date) ?? 0) + 1);
    }
  }
  return map;
}

function calcStreak(sessionHistory: SessionRecord[]): number {
  if (sessionHistory.length === 0) return 0;
  const days = new Set(sessionHistory.map((s) => s.date));
  let streak = 0;
  let current = new Date();
  // Check today + going back
  for (let i = 0; i < 365; i++) {
    const key = format(current, 'yyyy-MM-dd');
    if (days.has(key)) {
      streak++;
      current = new Date(current.getTime() - 86400000);
    } else if (i === 0) {
      // Today may not have a session yet — check yesterday
      current = new Date(current.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
}

// ── Calendar Component ──────────────────────────────────────
export const CalendarView: React.FC = () => {
  const { sessionHistory, achievements } = useGameStore();
  const [month, setMonth] = useState(new Date());

  const monthStart = startOfMonth(month);
  const monthEnd   = endOfMonth(month);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart); // 0=Sun

  const sessionsPerDay = getSessionsPerDay(sessionHistory, month);
  const streak = calcStreak(sessionHistory);

  // This month's sessions
  const monthKey = format(month, 'yyyy-MM');
  const monthSessions = sessionHistory.filter((s) => s.date.startsWith(monthKey));
  const totalMonthSessions = monthSessions.length;
  const totalMonthSeconds  = monthSessions.reduce((s, r) => s + r.durationSeconds, 0);
  const activeDaysThisMonth = new Set(monthSessions.map((s) => s.date)).size;
  const avgSecondsPerActiveDay = activeDaysThisMonth > 0
    ? Math.round(totalMonthSeconds / activeDaysThisMonth)
    : 0;
  const maxSessionsInDay = sessionsPerDay.size > 0
    ? Math.max(...Array.from(sessionsPerDay.values()))
    : 0;

  const fmtHM = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  };

  const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ padding: '20px 16px', maxWidth: 500, margin: '0 auto' }}>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <motion.button
          className="btn btn-ghost btn-icon"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
        >
          <ChevronLeft size={18} />
        </motion.button>

        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          {format(month, 'yyyy년 M월', { locale: ko })}
        </div>

        <motion.button
          className="btn btn-ghost btn-icon"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>

      {/* Calendar grid */}
      <div
        className="glass-card"
        style={{ padding: '16px', marginBottom: 16, overflow: 'hidden' }}
      >
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
          {WEEK_DAYS.map((d, i) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: i === 0 ? '#FF6B8A' : i === 6 ? '#89C4F4' : 'var(--text-muted)',
                paddingBottom: 6,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {/* Empty cells before month start */}
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const count = sessionsPerDay.get(key) ?? 0;
            const today = isToday(day);

            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.08 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 6,
                  paddingBottom: 6,
                  borderRadius: 'var(--radius-sm)',
                  background: today
                    ? 'rgba(255, 107, 138, 0.10)'
                    : 'transparent',
                  border: today ? '1.5px solid rgba(255, 107, 138, 0.30)' : '1.5px solid transparent',
                  cursor: 'default',
                  minHeight: 44,
                }}
              >
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: today ? 900 : 700,
                    color: today ? 'var(--rose)' : 'var(--text-primary)',
                  }}
                >
                  {format(day, 'd')}
                </span>

                {/* Session dots */}
                {count > 0 && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 3, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 22 }}>
                    {Array.from({ length: Math.min(count, 4) }).map((_, di) => (
                      <div
                        key={di}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: count >= 3
                            ? 'var(--rose)'
                            : count === 2
                              ? 'var(--lavender)'
                              : 'var(--mint)',
                        }}
                      />
                    ))}
                    {count > 4 && (
                      <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--rose)' }}>+</span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Streak */}
      <div
        className="glass-card"
        style={{ padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div style={{ fontSize: '2rem' }}>🔥</div>
        <div>
          <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            {streak}일 연속
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            집중 스트릭
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: '이번달 세션', value: `${totalMonthSessions}회`, emoji: '📊' },
          { label: '총 집중시간', value: fmtHM(totalMonthSeconds), emoji: '⏰' },
          { label: '하루 평균', value: fmtHM(avgSecondsPerActiveDay), emoji: '📈' },
          { label: '최다 세션/일', value: `${maxSessionsInDay}회`, emoji: '🏆' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{ padding: '14px 16px' }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{stat.emoji}</div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 12 }}>
          🏅 업적
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ACHIEVEMENTS.map((ach: AchievementDefinition) => {
            const record = achievements.find((a) => a.id === ach.id);
            const unlocked = record?.unlockedAt !== null && record?.unlockedAt !== undefined;
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: unlocked
                    ? 'rgba(255, 107, 138, 0.06)'
                    : 'rgba(255, 255, 255, 0.45)',
                  border: unlocked
                    ? '1.5px solid rgba(255, 107, 138, 0.25)'
                    : '1.5px solid rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(8px)',
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                <div style={{
                  fontSize: '1.6rem',
                  filter: unlocked ? 'none' : 'grayscale(1)',
                  flexShrink: 0,
                }}>
                  {ach.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {ach.nameKo}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {ach.descKo}
                  </div>
                </div>
                <div>
                  {unlocked ? (
                    <div style={{
                      background: 'rgba(255, 204, 68, 0.20)',
                      border: '1.5px solid rgba(255, 204, 68, 0.50)',
                      borderRadius: 'var(--radius-full)',
                      padding: '3px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#92400E',
                    }}>
                      +{ach.rewardCoins}🪙
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      🔒
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
