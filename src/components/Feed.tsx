import { fmtMinutes, fmtNum, fmtVolume, workoutType, workoutVolume, type ScoredWorkout } from '../game'
import type { Reaction } from '../types'
import type { Player } from '../useGroup'
import { LevelBadge } from './Home'

const EMOJIS = ['🔥', '💪', '👏', '😱']

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function Feed({
  me, players, reactions, onReact, onDelete,
}: {
  me: Player
  players: Player[]
  reactions: Reaction[]
  onReact: (workoutId: string, emoji: string) => void
  onDelete: (id: string) => void
}) {
  const items = players
    .flatMap((p) => p.scored.map((w) => ({ p, w })))
    .sort((a, b) => b.w.performedAt.localeCompare(a.w.performedAt))
    .slice(0, 100)

  if (!items.length) return <div className="empty">Nenhum treino ainda. Seja o primeiro! 🏁</div>

  return (
    <div className="stack">
      {items.map(({ p, w }) => (
        <FeedItem
          key={w.id}
          p={p}
          w={w}
          mine={p.profile.id === me.profile.id}
          meId={me.profile.id}
          reactions={reactions.filter((r) => r.workoutId === w.id)}
          onReact={(e) => onReact(w.id, e)}
          onDelete={() => onDelete(w.id)}
        />
      ))}
    </div>
  )
}

function FeedItem({ p, w, mine, meId, reactions, onReact, onDelete }: {
  p: Player; w: ScoredWorkout; mine: boolean; meId: string; reactions: Reaction[]
  onReact: (e: string) => void; onDelete: () => void
}) {
  const t = workoutType(w.type)
  const vol = workoutVolume(w)
  return (
    <article className="card feed-item">
      <div className="feed-head">
        <div className="avatar">{p.profile.avatar}</div>
        <div className="grow">
          <b>{p.profile.name}</b> <LevelBadge player={p} size="sm" />
          <div className="muted small">
            {t.icon} {t.label} · {timeAgo(w.performedAt)}
            {w.streakAt > 1 && <> · 🔥 {w.streakAt}</>}
          </div>
        </div>
        <div className="xp-chip">+{fmtNum(w.xp.total)} XP</div>
      </div>

      <div className="feed-stats">
        <span>⏱️ {fmtMinutes(w.durationMin)}</span>
        {w.calories > 0 && <span>🔥 {fmtNum(w.calories)} kcal</span>}
        {vol > 0 && <span>⚖️ {fmtVolume(vol)}</span>}
      </div>

      {w.exercises.length > 0 && (
        <ul className="ex-list">
          {w.exercises.map((e, i) => (
            <li key={i}>
              <span>{e.name}</span>
              <span className="muted">{e.sets}×{e.reps}{e.weight ? ` · ${fmtNum(e.weight)} kg` : ''}</span>
            </li>
          ))}
        </ul>
      )}
      {w.notes && <p className="notes">“{w.notes}”</p>}

      <div className="reactions">
        {EMOJIS.map((e) => {
          const list = reactions.filter((r) => r.emoji === e)
          const minePressed = list.some((r) => r.userId === meId)
          return (
            <button key={e} className={`react ${minePressed ? 'on' : ''}`} onClick={() => onReact(e)}>
              {e} {list.length > 0 && <small>{list.length}</small>}
            </button>
          )
        })}
        {mine && <button className="react del" onClick={onDelete}>Apagar</button>}
      </div>
    </article>
  )
}
