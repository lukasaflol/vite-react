import type { Workout } from './types'

/* ============================================================
 * REGRAS DO JOGO
 * Tudo que dá XP, níveis, streak e medalhas está aqui.
 * ============================================================ */

export const WORKOUT_TYPES = [
  { id: 'musculacao', label: 'Musculação', icon: '🏋️', met: 5 },
  { id: 'corrida', label: 'Corrida', icon: '🏃', met: 9.8 },
  { id: 'bike', label: 'Bike', icon: '🚴', met: 7.5 },
  { id: 'natacao', label: 'Natação', icon: '🏊', met: 8 },
  { id: 'cross', label: 'Funcional / Cross', icon: '🔥', met: 8 },
  { id: 'luta', label: 'Luta', icon: '🥊', met: 9 },
  { id: 'esporte', label: 'Esporte coletivo', icon: '⚽', met: 7 },
  { id: 'caminhada', label: 'Caminhada', icon: '🚶', met: 3.8 },
  { id: 'yoga', label: 'Yoga / Alongamento', icon: '🧘', met: 3 },
  { id: 'outro', label: 'Outro', icon: '⭐', met: 5 },
] as const

export function workoutType(id: string) {
  return WORKOUT_TYPES.find((t) => t.id === id) ?? WORKOUT_TYPES[WORKOUT_TYPES.length - 1]
}

export const COMMON_EXERCISES = [
  'Supino reto', 'Supino inclinado', 'Agachamento livre', 'Leg press', 'Levantamento terra',
  'Desenvolvimento', 'Remada curvada', 'Puxada frontal', 'Barra fixa', 'Rosca direta',
  'Tríceps corda', 'Elevação lateral', 'Cadeira extensora', 'Mesa flexora', 'Stiff',
  'Afundo', 'Panturrilha', 'Crucifixo', 'Abdominal', 'Flexão de braço', 'Hip thrust',
]

/** Limites anti-trapaça por treino */
export const LIMITS = { duration: 240, calories: 2000, durationXpCap: 180 }

export const XP_RULES = {
  base: 30, // por treino registrado
  perMinute: 1, // por minuto (até 180 min)
  perCalories: 10, // 1 XP a cada 10 kcal
  perVolume: 250, // 1 XP a cada 250 kg levantados (séries × reps × peso)
  volumeCap: 150,
  perReps: 10, // 1 XP a cada 10 repetições
  repsCap: 100,
  streakBonusPerDay: 0.02, // +2% por dia de streak
  streakBonusMax: 30, // até +60%
  extraWorkoutSameDay: 0.5, // a partir do 3º treino no mesmo dia vale 50%
}

export function workoutVolume(w: Pick<Workout, 'exercises'>) {
  return w.exercises.reduce((s, e) => s + (e.sets || 0) * (e.reps || 0) * (e.weight || 0), 0)
}
export function workoutReps(w: Pick<Workout, 'exercises'>) {
  return w.exercises.reduce((s, e) => s + (e.sets || 0) * (e.reps || 0), 0)
}

export interface XPBreakdown {
  base: number
  duration: number
  calories: number
  volume: number
  reps: number
  subtotal: number
  multiplier: number
  total: number
}

export function computeXP(
  w: Pick<Workout, 'durationMin' | 'calories' | 'exercises'>,
  streakDays: number,
  nthOfDay = 1,
): XPBreakdown {
  const base = XP_RULES.base
  const duration = Math.round(Math.min(w.durationMin || 0, LIMITS.durationXpCap) * XP_RULES.perMinute)
  const calories = Math.floor(Math.min(w.calories || 0, LIMITS.calories) / XP_RULES.perCalories)
  const volume = Math.min(Math.floor(workoutVolume(w) / XP_RULES.perVolume), XP_RULES.volumeCap)
  const reps = Math.min(Math.floor(workoutReps(w) / XP_RULES.perReps), XP_RULES.repsCap)
  const subtotal = base + duration + calories + volume + reps
  let multiplier = 1 + Math.min(Math.max(streakDays, 0), XP_RULES.streakBonusMax) * XP_RULES.streakBonusPerDay
  if (nthOfDay > 2) multiplier *= XP_RULES.extraWorkoutSameDay
  return { base, duration, calories, volume, reps, subtotal, multiplier, total: Math.round(subtotal * multiplier) }
}

/* ---------------- Datas ---------------- */

export function dayKey(d: Date | string) {
  const x = typeof d === 'string' ? new Date(d) : d
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function addDays(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}
export function startOfWeek(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (x.getDay() + 6) % 7 // segunda = 0
  x.setDate(x.getDate() - dow)
  return x
}
export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/* ---------------- Níveis ---------------- */

/** XP total necessário para alcançar o nível L */
export function xpForLevel(level: number) {
  return Math.round(100 * Math.pow(Math.max(level - 1, 0), 1.6))
}
export function levelFromXP(xp: number) {
  let l = 1
  while (xpForLevel(l + 1) <= xp) l++
  const cur = xpForLevel(l)
  const next = xpForLevel(l + 1)
  return { level: l, current: xp - cur, needed: next - cur, progress: (xp - cur) / (next - cur) }
}

export const TIERS = [
  { min: 1, title: 'Sedentário', icon: '🛋️', color: '#8b8b9e' },
  { min: 5, title: 'Iniciante', icon: '🐣', color: '#7dd3fc' },
  { min: 10, title: 'Frango', icon: '🐔', color: '#fde047' },
  { min: 15, title: 'Marombeiro', icon: '💪', color: '#fb923c' },
  { min: 20, title: 'Monstro', icon: '🦍', color: '#f87171' },
  { min: 30, title: 'Titã', icon: '🗿', color: '#c084fc' },
  { min: 40, title: 'Olimpiano', icon: '⚡', color: '#60a5fa' },
  { min: 50, title: 'Lenda', icon: '👑', color: '#facc15' },
]
export function tierFor(level: number) {
  return [...TIERS].reverse().find((t) => level >= t.min) ?? TIERS[0]
}

/* ---------------- Processamento ---------------- */

export interface ScoredWorkout extends Workout {
  xp: XPBreakdown
  streakAt: number
}

/** Ordena cronologicamente e calcula o XP de cada treino com o streak daquele dia. */
export function scoreWorkouts(workouts: Workout[]): ScoredWorkout[] {
  const sorted = [...workouts].sort((a, b) => a.performedAt.localeCompare(b.performedAt))
  const perDay = new Map<string, number>()
  let lastDay: string | null = null
  let streak = 0
  return sorted.map((w) => {
    const k = dayKey(w.performedAt)
    if (k !== lastDay) {
      streak = lastDay && addDays(lastDay, 1) === k ? streak + 1 : 1
      lastDay = k
    }
    const nth = (perDay.get(k) ?? 0) + 1
    perDay.set(k, nth)
    // streak anterior ao treino (o 1º dia não tem bônus)
    return { ...w, streakAt: streak, xp: computeXP(w, streak - 1, nth) }
  })
}

export function streaks(workouts: Pick<Workout, 'performedAt'>[], today = new Date()) {
  const days = [...new Set(workouts.map((w) => dayKey(w.performedAt)))].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  const set = new Set(days)
  const t = dayKey(today)
  let cursor = set.has(t) ? t : addDays(t, -1)
  let current = 0
  while (set.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }
  return { current, best, trainedToday: set.has(t), atRisk: !set.has(t) && current > 0 }
}

export interface UserStats {
  xp: number
  workouts: number
  minutes: number
  calories: number
  volume: number
  reps: number
  currentStreak: number
  bestStreak: number
  trainedToday: boolean
  streakAtRisk: boolean
  maxCalories: number
  maxDuration: number
  maxVolume: number
  maxRepsSession: number
  heaviest: number
  earlyBird: number
  nightOwl: number
  weekend: number
  types: number
  weeklyWins: number
  prs: Record<string, number>
}

export function computeStats(scored: ScoredWorkout[], weeklyWins = 0): UserStats {
  const s = streaks(scored)
  const prs: Record<string, number> = {}
  let heaviest = 0
  for (const w of scored) {
    for (const e of w.exercises) {
      const key = e.name.trim()
      if (!key) continue
      prs[key] = Math.max(prs[key] ?? 0, e.weight || 0)
      heaviest = Math.max(heaviest, e.weight || 0)
    }
  }
  const hour = (w: Workout) => new Date(w.performedAt).getHours()
  const dow = (w: Workout) => new Date(w.performedAt).getDay()
  return {
    xp: scored.reduce((a, w) => a + w.xp.total, 0),
    workouts: scored.length,
    minutes: scored.reduce((a, w) => a + w.durationMin, 0),
    calories: scored.reduce((a, w) => a + w.calories, 0),
    volume: scored.reduce((a, w) => a + workoutVolume(w), 0),
    reps: scored.reduce((a, w) => a + workoutReps(w), 0),
    currentStreak: s.current,
    bestStreak: s.best,
    trainedToday: s.trainedToday,
    streakAtRisk: s.atRisk,
    maxCalories: Math.max(0, ...scored.map((w) => w.calories)),
    maxDuration: Math.max(0, ...scored.map((w) => w.durationMin)),
    maxVolume: Math.max(0, ...scored.map(workoutVolume)),
    maxRepsSession: Math.max(0, ...scored.map(workoutReps)),
    heaviest,
    earlyBird: scored.filter((w) => hour(w) < 7).length,
    nightOwl: scored.filter((w) => hour(w) >= 21).length,
    weekend: scored.filter((w) => dow(w) === 0 || dow(w) === 6).length,
    types: new Set(scored.map((w) => w.type)).size,
    weeklyWins,
    prs,
  }
}

/** Conta quantas semanas completas (já encerradas) cada usuário foi o campeão de XP do grupo. */
export function weeklyChampions(scoredByUser: Map<string, ScoredWorkout[]>) {
  const weekXP = new Map<string, Map<string, number>>() // semana -> user -> xp
  const thisWeek = dayKey(startOfWeek())
  for (const [uid, list] of scoredByUser) {
    for (const w of list) {
      const wk = dayKey(startOfWeek(new Date(w.performedAt)))
      if (wk >= thisWeek) continue
      const m = weekXP.get(wk) ?? new Map<string, number>()
      m.set(uid, (m.get(uid) ?? 0) + w.xp.total)
      weekXP.set(wk, m)
    }
  }
  const wins = new Map<string, number>()
  for (const m of weekXP.values()) {
    let best: string | null = null
    let bestXp = -1
    for (const [uid, xp] of m) if (xp > bestXp) { best = uid; bestXp = xp }
    if (best) wins.set(best, (wins.get(best) ?? 0) + 1)
  }
  return wins
}

/* ---------------- Medalhas ---------------- */

export type MedalTier = 'bronze' | 'prata' | 'ouro' | 'diamante'

export interface Medal {
  id: string
  name: string
  icon: string
  tier: MedalTier
  description: string
  value: (s: UserStats) => number
  goal: number
}

const m = (
  id: string, name: string, icon: string, tier: MedalTier, description: string,
  value: (s: UserStats) => number, goal: number,
): Medal => ({ id, name, icon, tier, description, value, goal })

export const MEDALS: Medal[] = [
  // Constância
  m('first', 'Primeiro Passo', '👟', 'bronze', 'Registre seu primeiro treino', (s) => s.workouts, 1),
  m('w10', 'Pegando o Ritmo', '📅', 'bronze', '10 treinos registrados', (s) => s.workouts, 10),
  m('w50', 'Rato de Academia', '🐀', 'prata', '50 treinos registrados', (s) => s.workouts, 50),
  m('w100', 'Centurião', '🛡️', 'ouro', '100 treinos registrados', (s) => s.workouts, 100),
  m('w365', 'Um Ano de Ferro', '🏛️', 'diamante', '365 treinos registrados', (s) => s.workouts, 365),
  // Streak
  m('s3', 'Aquecendo', '🔥', 'bronze', 'Streak de 3 dias seguidos', (s) => s.bestStreak, 3),
  m('s7', 'Semana Perfeita', '🗓️', 'bronze', 'Streak de 7 dias seguidos', (s) => s.bestStreak, 7),
  m('s14', 'Imparável', '🚂', 'prata', 'Streak de 14 dias seguidos', (s) => s.bestStreak, 14),
  m('s30', 'Disciplina de Monge', '🧘‍♂️', 'ouro', 'Streak de 30 dias seguidos', (s) => s.bestStreak, 30),
  m('s100', 'Máquina', '🤖', 'diamante', 'Streak de 100 dias seguidos', (s) => s.bestStreak, 100),
  // Calorias
  m('c800', 'Queima Brava', '🌶️', 'prata', '800 kcal em um único treino', (s) => s.maxCalories, 800),
  m('c10k', 'Fornalha', '♨️', 'bronze', '10.000 kcal queimadas no total', (s) => s.calories, 10000),
  m('c50k', 'Vulcão', '🌋', 'ouro', '50.000 kcal queimadas no total', (s) => s.calories, 50000),
  m('c100k', 'Supernova', '☄️', 'diamante', '100.000 kcal queimadas no total', (s) => s.calories, 100000),
  // Tempo
  m('t120', 'Maratonista', '⏱️', 'prata', 'Treino de 2h ou mais', (s) => s.maxDuration, 120),
  m('t50h', 'Tempo é Músculo', '⌛', 'prata', '50 horas de treino no total', (s) => s.minutes, 3000),
  m('t200h', 'Morador da Academia', '🏠', 'ouro', '200 horas de treino no total', (s) => s.minutes, 12000),
  // Peso / volume
  m('h100', 'Clube dos 100', '🏋️', 'prata', 'Levante 100 kg ou mais em um exercício', (s) => s.heaviest, 100),
  m('h150', 'Força Bruta', '🦏', 'ouro', 'Levante 150 kg ou mais em um exercício', (s) => s.heaviest, 150),
  m('v10t', 'Carregador de Piano', '🎹', 'bronze', '10 toneladas levantadas no total', (s) => s.volume, 10000),
  m('v100t', 'Guindaste', '🏗️', 'prata', '100 toneladas levantadas no total', (s) => s.volume, 100000),
  m('v1000t', 'Atlas', '🌍', 'diamante', '1.000 toneladas levantadas no total', (s) => s.volume, 1000000),
  m('vs10t', 'Dia de Fúria', '😤', 'ouro', '10 toneladas em um único treino', (s) => s.maxVolume, 10000),
  // Repetições
  m('r500', 'Metralhadora', '🔁', 'prata', '500 repetições em um único treino', (s) => s.maxRepsSession, 500),
  m('r10k', 'Dez Mil', '🔟', 'ouro', '10.000 repetições no total', (s) => s.reps, 10000),
  // Estilo
  m('early', 'Madrugador', '🌅', 'prata', '10 treinos antes das 7h', (s) => s.earlyBird, 10),
  m('night', 'Coruja', '🦉', 'prata', '10 treinos depois das 21h', (s) => s.nightOwl, 10),
  m('weekend', 'Sem Folga', '🎉', 'prata', '10 treinos no fim de semana', (s) => s.weekend, 10),
  m('variety', 'Eclético', '🎨', 'bronze', 'Treine 5 modalidades diferentes', (s) => s.types, 5),
  // Competição
  m('champ1', 'Rei da Semana', '🥇', 'ouro', 'Termine uma semana em 1º no grupo', (s) => s.weeklyWins, 1),
  m('champ5', 'Dinastia', '🏆', 'diamante', 'Seja campeão semanal 5 vezes', (s) => s.weeklyWins, 5),
]

export const TIER_COLORS: Record<MedalTier, string> = {
  bronze: '#cd7f32',
  prata: '#c0c7d2',
  ouro: '#facc15',
  diamante: '#67e8f9',
}

export function earnedMedals(s: UserStats) {
  return MEDALS.filter((md) => md.value(s) >= md.goal)
}

/* ---------------- Calorias ---------------- */

export function estimateCalories(typeId: string, minutes: number, bodyWeight = 75) {
  return Math.round(workoutType(typeId).met * bodyWeight * (minutes / 60))
}

export function fmtNum(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}
export function fmtVolume(kg: number) {
  return kg >= 1000 ? `${fmtNum(kg / 1000)} t` : `${fmtNum(kg)} kg`
}
export function fmtMinutes(min: number) {
  const h = Math.floor(min / 60)
  const mm = min % 60
  return h ? `${h}h${mm ? String(mm).padStart(2, '0') : ''}` : `${mm} min`
}
