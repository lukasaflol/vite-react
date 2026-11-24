import { dayKey, fmtMinutes, fmtNum, fmtVolume, MEDALS, startOfWeek, TIER_COLORS, xpForLevel } from '../game'
import type { Player } from '../useGroup'

type Tab = 'home' | 'feed' | 'ranking' | 'medals' | 'profile'

export function LevelBadge({ player, size = 'md' }: { player: Player; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`level-badge ${size}`} style={{ borderColor: player.tier.color, color: player.tier.color }}>
      {player.level.level}
    </span>
  )
}

export function XPBar({ player }: { player: Player }) {
  const { level, current, needed, progress } = player.level
  return (
    <div className="xpbar-wrap">
      <div className="xpbar">
        <div className="xpbar-fill" style={{ width: `${Math.round(progress * 100)}%`, background: player.tier.color }} />
      </div>
      <div className="xpbar-label">
        <span>{fmtNum(current)} / {fmtNum(needed)} XP</span>
        <span>Nível {level + 1} em {fmtNum(xpForLevel(level + 1) - player.stats.xp)} XP</span>
      </div>
    </div>
  )
}

export default function Home({ me, players, onLog, onGo }: { me: Player; players: Player[]; onLog: () => void; onGo: (t: Tab) => void }) {
  const s = me.stats
  const weekStart = startOfWeek()
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i))
  const trainedDays = new Set(me.scored.map((w) => dayKey(w.performedAt)))
  const today = dayKey(new Date())

  const weekXP = (p: Player) => p.scored.filter((w) => new Date(w.performedAt) >= weekStart).reduce((a, w) => a + w.xp.total, 0)
  const weekRank = [...players].sort((a, b) => weekXP(b) - weekXP(a))
  const myPos = weekRank.findIndex((p) => p.profile.id === me.profile.id) + 1
  const ahead = myPos > 1 ? weekRank[myPos - 2] : null

  const earnedIds = new Set(me.medals.map((m) => m.id))
  const nextMedals = MEDALS.filter((m) => !earnedIds.has(m.id))
    .map((m) => ({ m, p: Math.min(m.value(s) / m.goal, 1) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 3)

  return (
    <div className="stack">
      <section className="card hero-card" style={{ ['--tier' as string]: me.tier.color }}>
        <div className="hero-row">
          <div className="avatar lg">{me.profile.avatar}</div>
          <div className="grow">
            <div className="hello">E aí, {me.profile.name}!</div>
            <div className="tier" style={{ color: me.tier.color }}>
              {me.tier.icon} {me.tier.title}
            </div>
          </div>
          <div className="level-big">
            <small>NÍVEL</small>
            <b style={{ color: me.tier.color }}>{me.level.level}</b>
          </div>
        </div>
        <XPBar player={me} />
        <div className="total-xp">{fmtNum(s.xp)} XP no total</div>
      </section>

      <section className={`card streak-card ${s.streakAtRisk ? 'risk' : ''}`}>
        <div className="streak-main">
          <div className={`flame ${s.currentStreak > 0 ? 'on' : ''}`}>🔥</div>
          <div>
            <div className="streak-num">{s.currentStreak} {s.currentStreak === 1 ? 'dia' : 'dias'}</div>
            <div className="muted">Recorde: {s.bestStreak} dias · bônus +{Math.min(Math.max(s.currentStreak, 0), 30) * 2}% XP</div>
          </div>
        </div>
        {s.streakAtRisk && <div className="risk-msg">⚠️ Você ainda não treinou hoje — não perca seu streak!</div>}
        {s.trainedToday && <div className="ok-msg">✅ Treino de hoje feito!</div>}
        <div className="week-dots">
          {days.map((d) => {
            const k = dayKey(d)
            return (
              <div key={k} className={`dot ${trainedDays.has(k) ? 'done' : ''} ${k === today ? 'today' : ''} ${k > today ? 'future' : ''}`}>
                <small>{d.toLocaleDateString('pt-BR', { weekday: 'narrow' })}</small>
                <span>{trainedDays.has(k) ? '✓' : d.getDate()}</span>
              </div>
            )
          })}
        </div>
      </section>

      {!s.trainedToday && (
        <button className="btn primary block big" onClick={onLog}>
          Registrar treino de hoje 💪
        </button>
      )}

      <section className="card clickable" onClick={() => onGo('ranking')}>
        <div className="row-between">
          <h3>Ranking da semana</h3>
          <span className="pos">#{myPos}</span>
        </div>
        <p className="muted">
          {myPos === 1
            ? weekXP(me) > 0 ? '👑 Você está liderando! Segura a coroa.' : 'Ninguém pontuou ainda nesta semana. Saia na frente!'
            : `Faltam ${fmtNum(weekXP(ahead!) - weekXP(me) + 1)} XP para passar ${ahead!.profile.name} ${ahead!.profile.avatar}`}
        </p>
      </section>

      <section className="grid-4">
        <Stat icon="🏋️" label="Treinos" value={fmtNum(s.workouts)} />
        <Stat icon="⏱️" label="Tempo" value={fmtMinutes(s.minutes)} />
        <Stat icon="🔥" label="Calorias" value={fmtNum(s.calories)} />
        <Stat icon="⚖️" label="Volume" value={fmtVolume(s.volume)} />
      </section>

      <section className="card clickable" onClick={() => onGo('medals')}>
        <div className="row-between">
          <h3>Próximas medalhas</h3>
          <span className="muted">{me.medals.length}/{MEDALS.length}</span>
        </div>
        {nextMedals.map(({ m, p }) => (
          <div className="next-medal" key={m.id}>
            <span className="medal-icon sm" style={{ borderColor: TIER_COLORS[m.tier] }}>{m.icon}</span>
            <div className="grow">
              <div className="row-between">
                <b>{m.name}</b>
                <small className="muted">{Math.round(p * 100)}%</small>
              </div>
              <small className="muted">{m.description}</small>
              <div className="mini-bar"><div style={{ width: `${p * 100}%`, background: TIER_COLORS[m.tier] }} /></div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  )
}
