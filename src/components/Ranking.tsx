import { useState } from 'react'
import { fmtMinutes, fmtNum, fmtVolume, startOfMonth, startOfWeek, workoutReps, workoutVolume, type ScoredWorkout } from '../game'
import type { Player } from '../useGroup'
import { LevelBadge } from './Home'

type Period = 'week' | 'month' | 'all'
type Metric = 'xp' | 'level' | 'calories' | 'minutes' | 'volume' | 'reps' | 'workouts' | 'streak'

const METRICS: { id: Metric; label: string; icon: string; fmt: (n: number) => string; periodic: boolean }[] = [
  { id: 'xp', label: 'XP', icon: '⚡', fmt: (n) => `${fmtNum(n)} XP`, periodic: true },
  { id: 'level', label: 'Nível', icon: '🎚️', fmt: (n) => `Nv. ${n}`, periodic: false },
  { id: 'calories', label: 'Calorias', icon: '🔥', fmt: (n) => `${fmtNum(n)} kcal`, periodic: true },
  { id: 'minutes', label: 'Tempo', icon: '⏱️', fmt: fmtMinutes, periodic: true },
  { id: 'volume', label: 'Peso', icon: '⚖️', fmt: fmtVolume, periodic: true },
  { id: 'reps', label: 'Reps', icon: '🔁', fmt: (n) => `${fmtNum(n)} reps`, periodic: true },
  { id: 'workouts', label: 'Treinos', icon: '📅', fmt: (n) => `${n} treinos`, periodic: true },
  { id: 'streak', label: 'Streak', icon: '🔥', fmt: (n) => `${n} dias`, periodic: false },
]

function value(p: Player, metric: Metric, list: ScoredWorkout[]) {
  switch (metric) {
    case 'xp': return list.reduce((a, w) => a + w.xp.total, 0)
    case 'level': return p.level.level
    case 'calories': return list.reduce((a, w) => a + w.calories, 0)
    case 'minutes': return list.reduce((a, w) => a + w.durationMin, 0)
    case 'volume': return list.reduce((a, w) => a + workoutVolume(w), 0)
    case 'reps': return list.reduce((a, w) => a + workoutReps(w), 0)
    case 'workouts': return list.length
    case 'streak': return p.stats.currentStreak
  }
}

export default function Ranking({ me, players }: { me: Player; players: Player[] }) {
  const [period, setPeriod] = useState<Period>('week')
  const [metric, setMetric] = useState<Metric>('xp')
  const def = METRICS.find((m) => m.id === metric)!
  const from = period === 'week' ? startOfWeek() : period === 'month' ? startOfMonth() : new Date(0)

  const rows = players
    .map((p) => {
      const list = p.scored.filter((w) => new Date(w.performedAt) >= from)
      return { p, v: value(p, metric, list) }
    })
    .sort((a, b) => b.v - a.v || b.p.stats.xp - a.p.stats.xp)

  const max = Math.max(1, ...rows.map((r) => r.v))
  const podium = rows.slice(0, 3)

  return (
    <div className="stack">
      {def.periodic && (
        <div className="segmented">
          {(['week', 'month', 'all'] as Period[]).map((x) => (
            <button key={x} className={period === x ? 'sel' : ''} onClick={() => setPeriod(x)}>
              {x === 'week' ? 'Semana' : x === 'month' ? 'Mês' : 'Geral'}
            </button>
          ))}
        </div>
      )}
      <div className="chips">
        {METRICS.map((m) => (
          <button key={m.id} className={`chip ${metric === m.id ? 'sel' : ''}`} onClick={() => setMetric(m.id)}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {podium.length >= 2 && (
        <div className="podium">
          {[podium[1], podium[0], podium[2]].map((r, i) =>
            r ? (
              <div key={r.p.profile.id} className={`podium-col p${[2, 1, 3][i]}`}>
                {[2, 1, 3][i] === 1 && <div className="crown">👑</div>}
                <div className="avatar lg">{r.p.profile.avatar}</div>
                <b>{r.p.profile.name}</b>
                <small>{def.fmt(r.v)}</small>
                <div className="podium-block">{[2, 1, 3][i]}º</div>
              </div>
            ) : <div key={i} className="podium-col" />,
          )}
        </div>
      )}

      <div className="card list">
        {rows.map((r, i) => (
          <div key={r.p.profile.id} className={`rank-row ${r.p.profile.id === me.profile.id ? 'me' : ''}`}>
            <span className="rank-pos">{i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}º`}</span>
            <span className="avatar sm">{r.p.profile.avatar}</span>
            <div className="grow">
              <div className="row-between">
                <span>
                  {r.p.profile.name} <LevelBadge player={r.p} size="sm" />
                </span>
                <b>{def.fmt(r.v)}</b>
              </div>
              <div className="mini-bar">
                <div style={{ width: `${(r.v / max) * 100}%`, background: r.p.tier.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
