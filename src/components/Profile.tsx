import { useState } from 'react'
import { fmtMinutes, fmtNum, fmtVolume, LIMITS, TIERS, XP_RULES, xpForLevel } from '../game'
import type { Group, Profile } from '../types'
import type { Player } from '../useGroup'
import { Stat, XPBar } from './Home'
import { AVATARS } from './Onboarding'

export default function ProfileView({ me, group, onSave, onLogout }: {
  me: Player; group: Group | null; onSave: (p: Profile) => Promise<void>; onLogout: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(me.profile.name)
  const [avatar, setAvatar] = useState(me.profile.avatar)
  const [bw, setBw] = useState<number | ''>(me.profile.bodyWeight ?? '')
  const [copied, setCopied] = useState(false)
  const s = me.stats
  const inviteUrl = `${location.origin}${location.pathname}?g=${me.profile.groupCode}`

  async function share() {
    const text = `Bora competir no LevelUp! Entra no grupo "${group?.name}" com o código ${me.profile.groupCode}`
    if (navigator.share) {
      try { await navigator.share({ title: 'LevelUp', text, url: inviteUrl }) } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${inviteUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const prs = Object.entries(s.prs).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])

  return (
    <div className="stack">
      <section className="card">
        <div className="hero-row">
          <div className="avatar lg">{me.profile.avatar}</div>
          <div className="grow">
            <h2>{me.profile.name}</h2>
            <div style={{ color: me.tier.color }}>{me.tier.icon} {me.tier.title} · Nível {me.level.level}</div>
          </div>
          <button className="btn small" onClick={() => setEditing(!editing)}>{editing ? 'Fechar' : 'Editar'}</button>
        </div>
        <XPBar player={me} />

        {editing && (
          <div className="edit-box">
            <label>Nome</label>
            <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
            <label>Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map((a) => (
                <button key={a} className={`avatar-opt ${a === avatar ? 'sel' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
              ))}
            </div>
            <label>Peso corporal (kg) <small className="muted">— usado para estimar calorias</small></label>
            <input type="number" value={bw} onChange={(e) => setBw(e.target.value === '' ? '' : +e.target.value)} />
            <button
              className="btn primary block"
              onClick={async () => {
                await onSave({ ...me.profile, name: name.trim() || me.profile.name, avatar, bodyWeight: bw === '' ? undefined : bw })
                setEditing(false)
              }}
            >
              Salvar
            </button>
          </div>
        )}
      </section>

      <section className="card invite">
        <h3>Convide a galera</h3>
        <div className="invite-code">{me.profile.groupCode}</div>
        <button className="btn primary block" onClick={share}>{copied ? 'Link copiado! ✅' : 'Compartilhar convite 📲'}</button>
      </section>

      <section className="grid-4">
        <Stat icon="🏋️" label="Treinos" value={fmtNum(s.workouts)} />
        <Stat icon="⏱️" label="Tempo total" value={fmtMinutes(s.minutes)} />
        <Stat icon="🔥" label="kcal total" value={fmtNum(s.calories)} />
        <Stat icon="⚖️" label="Volume" value={fmtVolume(s.volume)} />
        <Stat icon="🔁" label="Repetições" value={fmtNum(s.reps)} />
        <Stat icon="📈" label="Melhor streak" value={`${s.bestStreak} d`} />
        <Stat icon="🏋️‍♂️" label="Maior carga" value={`${fmtNum(s.heaviest)} kg`} />
        <Stat icon="🥇" label="Semanas em 1º" value={String(s.weeklyWins)} />
      </section>

      {prs.length > 0 && (
        <section className="card">
          <h3>🎯 Recordes pessoais</h3>
          <ul className="ex-list">
            {prs.map(([k, v]) => <li key={k}><span>{k}</span><b>{fmtNum(v)} kg</b></li>)}
          </ul>
        </section>
      )}

      <details className="card rules">
        <summary><h3>📜 Como funciona a pontuação</h3></summary>
        <ul>
          <li><b>+{XP_RULES.base} XP</b> por treino registrado</li>
          <li><b>+{XP_RULES.perMinute} XP</b> por minuto de treino (até {LIMITS.durationXpCap} min)</li>
          <li><b>+1 XP</b> a cada {XP_RULES.perCalories} kcal queimadas</li>
          <li><b>+1 XP</b> a cada {XP_RULES.perVolume} kg de volume (séries × reps × peso), até {XP_RULES.volumeCap} XP</li>
          <li><b>+1 XP</b> a cada {XP_RULES.perReps} repetições, até {XP_RULES.repsCap} XP</li>
          <li><b>Bônus de streak:</b> +{XP_RULES.streakBonusPerDay * 100}% por dia seguido (máx. +{XP_RULES.streakBonusMax * XP_RULES.streakBonusPerDay * 100}%)</li>
          <li>A partir do 3º treino no mesmo dia, o XP vale {XP_RULES.extraWorkoutSameDay * 100}%</li>
          <li>Treinos só podem ser registrados até 7 dias para trás</li>
        </ul>
        <h4>Títulos</h4>
        <ul className="tiers">
          {TIERS.map((t) => (
            <li key={t.title} style={{ color: t.color }}>
              {t.icon} <b>{t.title}</b> — nível {t.min}+ <small className="muted">({fmtNum(xpForLevel(t.min))} XP)</small>
            </li>
          ))}
        </ul>
      </details>

      <button className="btn ghost block" onClick={onLogout}>Sair deste aparelho</button>
    </div>
  )
}
