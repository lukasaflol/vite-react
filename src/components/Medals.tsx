import { useState } from 'react'
import { fmtNum, MEDALS, TIER_COLORS, type MedalTier } from '../game'
import type { Player } from '../useGroup'

const TIERS: MedalTier[] = ['diamante', 'ouro', 'prata', 'bronze']
const TIER_ICON: Record<MedalTier, string> = { diamante: '💎', ouro: '🥇', prata: '🥈', bronze: '🥉' }

export default function Medals({ me, players }: { me: Player; players: Player[] }) {
  const [viewId, setViewId] = useState(me.profile.id)
  const view = players.find((p) => p.profile.id === viewId) ?? me
  const earned = new Set(view.medals.map((m) => m.id))

  const board = [...players]
    .map((p) => ({ p, counts: TIERS.map((t) => p.medals.filter((m) => m.tier === t).length) }))
    .sort((a, b) => {
      for (let i = 0; i < TIERS.length; i++) if (b.counts[i] !== a.counts[i]) return b.counts[i] - a.counts[i]
      return 0
    })

  return (
    <div className="stack">
      <section className="card">
        <h3>Quadro de medalhas</h3>
        <table className="medal-table">
          <thead>
            <tr>
              <th />
              {TIERS.map((t) => <th key={t} style={{ color: TIER_COLORS[t] }} title={t}>{TIER_ICON[t]}</th>)}
            </tr>
          </thead>
          <tbody>
            {board.map(({ p, counts }) => (
              <tr key={p.profile.id} className={p.profile.id === viewId ? 'sel' : ''} onClick={() => setViewId(p.profile.id)}>
                <td>{p.profile.avatar} {p.profile.name}</td>
                {counts.map((c, i) => <td key={i}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <small className="muted">Toque em alguém para ver as medalhas dessa pessoa.</small>
      </section>

      <h3 className="section-title">
        {view.profile.avatar} {view.profile.id === me.profile.id ? 'Suas medalhas' : `Medalhas de ${view.profile.name}`} · {view.medals.length}/{MEDALS.length}
      </h3>
      <div className="medal-grid">
        {MEDALS.map((m) => {
          const got = earned.has(m.id)
          const v = m.value(view.stats)
          const p = Math.min(v / m.goal, 1)
          return (
            <div key={m.id} className={`medal ${got ? 'got' : 'locked'}`} style={{ ['--tc' as string]: TIER_COLORS[m.tier] }}>
              <div className="medal-icon">{m.icon}</div>
              <b>{m.name}</b>
              <small>{m.description}</small>
              {!got && (
                <>
                  <div className="mini-bar"><div style={{ width: `${p * 100}%`, background: TIER_COLORS[m.tier] }} /></div>
                  <small className="muted">{fmtNum(Math.min(v, m.goal))} / {fmtNum(m.goal)}</small>
                </>
              )}
              <span className="tier-tag">{m.tier}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
