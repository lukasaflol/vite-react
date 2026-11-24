import { fmtNum, TIER_COLORS, type Medal, type TIERS, type XPBreakdown } from '../game'

export interface CelebrationData {
  xp?: XPBreakdown
  levelBefore: number
  levelAfter: number
  tierAfter: (typeof TIERS)[number]
  tierChanged: boolean
  newMedals: Medal[]
  prs: { name: string; weight: number }[]
  streak: number
}

export default function Celebration({ data, onClose }: { data: CelebrationData; onClose: () => void }) {
  const leveled = data.levelAfter > data.levelBefore
  return (
    <div className="modal-bg center" onClick={onClose}>
      <div className="celebration" onClick={(e) => e.stopPropagation()}>
        <div className="confetti" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.12}s`, background: ['#facc15', '#f87171', '#60a5fa', '#4ade80', '#c084fc'][i % 5] }} />
          ))}
        </div>
        <div className="cel-xp">+{fmtNum(data.xp?.total ?? 0)} XP</div>
        {data.streak > 0 && <div className="cel-line">🔥 Streak de {data.streak} {data.streak === 1 ? 'dia' : 'dias'}</div>}

        {leveled && (
          <div className="cel-level" style={{ color: data.tierAfter.color }}>
            <small>LEVEL UP!</small>
            <div>Nível {data.levelBefore} → <b>{data.levelAfter}</b></div>
            {data.tierChanged && <div className="cel-tier">{data.tierAfter.icon} Agora você é {data.tierAfter.title}!</div>}
          </div>
        )}

        {data.prs.length > 0 && (
          <div className="cel-block">
            <h4>🎯 Novos recordes</h4>
            {data.prs.map((p) => <div key={p.name}>{p.name}: <b>{fmtNum(p.weight)} kg</b></div>)}
          </div>
        )}

        {data.newMedals.length > 0 && (
          <div className="cel-block">
            <h4>🎖️ Medalhas desbloqueadas</h4>
            <div className="cel-medals">
              {data.newMedals.map((m) => (
                <div key={m.id} className="cel-medal" style={{ borderColor: TIER_COLORS[m.tier] }}>
                  <span>{m.icon}</span>
                  <small>{m.name}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn primary block" onClick={onClose}>Bora! 💪</button>
      </div>
    </div>
  )
}
