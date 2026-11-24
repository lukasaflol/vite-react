import { useMemo, useState } from 'react'
import { COMMON_EXERCISES, computeXP, dayKey, estimateCalories, fmtNum, fmtVolume, LIMITS, WORKOUT_TYPES, workoutVolume } from '../game'
import { uid } from '../storage'
import type { Exercise, Workout } from '../types'
import type { Player } from '../useGroup'

function localInputValue(d: Date) {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function WorkoutForm({ me, onSave, onCancel }: { me: Player; onSave: (w: Workout) => Promise<void>; onCancel: () => void }) {
  const [type, setType] = useState('musculacao')
  const [when, setWhen] = useState(localInputValue(new Date()))
  const [duration, setDuration] = useState(60)
  const [calories, setCalories] = useState<number | ''>('')
  const [exercises, setExercises] = useState<Exercise[]>([{ name: '', sets: 3, reps: 10, weight: 0 }])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const cleanExercises = exercises.filter((e) => e.name.trim())
  const draft = { durationMin: duration || 0, calories: Number(calories) || 0, exercises: cleanExercises }

  // streak e posição no dia para o preview
  const preview = useMemo(() => {
    const d = new Date(when)
    const k = dayKey(d)
    const sameDay = me.scored.filter((w) => dayKey(w.performedAt) === k).length
    const yesterday = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))
    const prevStreak = sameDay
      ? me.scored.find((w) => dayKey(w.performedAt) === k)!.streakAt - 1
      : me.scored.filter((w) => dayKey(w.performedAt) === yesterday).at(-1)?.streakAt ?? 0
    return computeXP(draft, prevStreak, sameDay + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when, duration, calories, exercises, me.scored])

  const update = (i: number, patch: Partial<Exercise>) =>
    setExercises((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  async function submit() {
    setError('')
    const d = new Date(when)
    if (isNaN(d.getTime())) return setError('Data inválida')
    if (d.getTime() > Date.now() + 5 * 60000) return setError('Não dá pra registrar treino no futuro 😅')
    if (Date.now() - d.getTime() > 7 * 86400000) return setError('Só é possível registrar treinos dos últimos 7 dias')
    if (!duration || duration < 5) return setError('Duração mínima: 5 minutos')
    if (duration > LIMITS.duration) return setError(`Duração máxima: ${LIMITS.duration} minutos`)
    if (Number(calories) > LIMITS.calories) return setError(`Máximo de ${LIMITS.calories} kcal por treino`)
    setBusy(true)
    try {
      await onSave({
        id: uid(),
        userId: me.profile.id,
        groupCode: me.profile.groupCode,
        performedAt: d.toISOString(),
        type,
        durationMin: Math.round(duration),
        calories: Math.round(Number(calories) || 0),
        exercises: cleanExercises.map((e) => ({ name: e.name.trim(), sets: +e.sets || 0, reps: +e.reps || 0, weight: +e.weight || 0 })),
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
      setBusy(false)
    }
  }

  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Registrar treino</h2>
          <button className="icon-btn" onClick={onCancel}>✕</button>
        </div>

        <label>Modalidade</label>
        <div className="type-grid">
          {WORKOUT_TYPES.map((t) => (
            <button key={t.id} className={`type-opt ${t.id === type ? 'sel' : ''}`} onClick={() => setType(t.id)}>
              <span>{t.icon}</span>
              <small>{t.label}</small>
            </button>
          ))}
        </div>

        <div className="row2">
          <div>
            <label>Quando</label>
            <input type="datetime-local" value={when} max={localInputValue(new Date())} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <label>Duração (min)</label>
            <input type="number" inputMode="numeric" min={5} max={LIMITS.duration} value={duration || ''} onChange={(e) => setDuration(+e.target.value)} />
          </div>
        </div>

        <label>Calorias (kcal)</label>
        <div className="input-with-btn">
          <input type="number" inputMode="numeric" min={0} max={LIMITS.calories} value={calories} placeholder="do relógio / app" onChange={(e) => setCalories(e.target.value === '' ? '' : +e.target.value)} />
          <button className="btn small" onClick={() => setCalories(estimateCalories(type, duration, me.profile.bodyWeight))}>Estimar</button>
        </div>

        <label>Exercícios <small className="muted">(séries × reps × kg)</small></label>
        <datalist id="exercises">
          {[...new Set([...Object.keys(me.stats.prs), ...COMMON_EXERCISES])].map((e) => <option key={e} value={e} />)}
        </datalist>
        <div className="exercises">
          {exercises.map((ex, i) => {
            const pr = me.stats.prs[ex.name.trim()]
            const isPR = pr !== undefined && ex.weight > pr
            return (
              <div className="exercise" key={i}>
                <input list="exercises" placeholder="Exercício" value={ex.name} onChange={(e) => update(i, { name: e.target.value })} />
                <div className="ex-nums">
                  <input type="number" inputMode="numeric" min={0} value={ex.sets || ''} placeholder="séries" onChange={(e) => update(i, { sets: +e.target.value })} />
                  <span>×</span>
                  <input type="number" inputMode="numeric" min={0} value={ex.reps || ''} placeholder="reps" onChange={(e) => update(i, { reps: +e.target.value })} />
                  <span>×</span>
                  <input type="number" inputMode="decimal" min={0} step={0.5} value={ex.weight || ''} placeholder="kg" onChange={(e) => update(i, { weight: +e.target.value })} />
                  <button className="icon-btn" onClick={() => setExercises((xs) => xs.filter((_, j) => j !== i))}>🗑️</button>
                </div>
                {pr !== undefined && (
                  <small className={isPR ? 'pr-hit' : 'muted'}>{isPR ? `🎯 NOVO RECORDE! (antes ${pr} kg)` : `Recorde: ${pr} kg`}</small>
                )}
              </div>
            )
          })}
        </div>
        <button className="btn ghost block" onClick={() => setExercises((xs) => [...xs, { name: '', sets: 3, reps: 10, weight: 0 }])}>
          + Adicionar exercício
        </button>

        <label>Notas</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Como foi? Dia de perna sofrido…" />

        <div className="xp-preview">
          <div className="row-between">
            <b>XP previsto</b>
            <b className="xp-total">+{fmtNum(preview.total)} XP</b>
          </div>
          <div className="xp-lines">
            <span>Treino +{preview.base}</span>
            <span>Tempo +{preview.duration}</span>
            <span>Calorias +{preview.calories}</span>
            <span>Volume +{preview.volume} <small>({fmtVolume(workoutVolume(draft))})</small></span>
            <span>Reps +{preview.reps}</span>
            <span className={preview.multiplier > 1 ? 'bonus' : preview.multiplier < 1 ? 'malus' : ''}>
              × {preview.multiplier.toFixed(2)} {preview.multiplier >= 1 ? 'streak' : '(3º+ treino do dia)'}
            </span>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn primary block big" disabled={busy} onClick={submit}>
          {busy ? 'Salvando…' : 'Salvar e ganhar XP ⚡'}
        </button>
      </div>
    </div>
  )
}
