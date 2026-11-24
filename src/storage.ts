import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Group, Profile, Reaction, Workout } from './types'

/* ============================================================
 * Camada de dados.
 * - Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY definidos, usa o
 *   Supabase e todos os amigos do grupo compartilham os dados.
 * - Sem isso, roda em "modo local" (localStorage) — bom para testar.
 * ============================================================ */

export interface Store {
  mode: 'supabase' | 'local'
  getGroup(code: string): Promise<Group | null>
  createGroup(g: Group): Promise<void>
  getProfiles(groupCode: string): Promise<Profile[]>
  upsertProfile(p: Profile): Promise<void>
  getWorkouts(groupCode: string): Promise<Workout[]>
  addWorkout(w: Workout): Promise<void>
  deleteWorkout(id: string): Promise<void>
  getReactions(groupCode: string): Promise<Reaction[]>
  toggleReaction(r: Reaction, groupCode: string): Promise<void>
}

export const uid = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/* ---------------- Local ---------------- */

type DB = { groups: Group[]; profiles: Profile[]; workouts: Workout[]; reactions: (Reaction & { groupCode: string })[] }
const KEY = 'levelup-db'

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { groups: [], profiles: [], workouts: [], reactions: [] }
}
function save(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

const localStore: Store = {
  mode: 'local',
  async getGroup(code) {
    return load().groups.find((g) => g.code === code) ?? null
  },
  async createGroup(g) {
    const db = load()
    db.groups.push(g)
    save(db)
  },
  async getProfiles(code) {
    return load().profiles.filter((p) => p.groupCode === code)
  },
  async upsertProfile(p) {
    const db = load()
    db.profiles = [...db.profiles.filter((x) => x.id !== p.id), p]
    save(db)
  },
  async getWorkouts(code) {
    return load().workouts.filter((w) => w.groupCode === code)
  },
  async addWorkout(w) {
    const db = load()
    db.workouts.push(w)
    save(db)
  },
  async deleteWorkout(id) {
    const db = load()
    db.workouts = db.workouts.filter((w) => w.id !== id)
    db.reactions = db.reactions.filter((r) => r.workoutId !== id)
    save(db)
  },
  async getReactions(code) {
    return load().reactions.filter((r) => r.groupCode === code)
  },
  async toggleReaction(r, groupCode) {
    const db = load()
    const same = (x: Reaction) => x.workoutId === r.workoutId && x.userId === r.userId && x.emoji === r.emoji
    if (db.reactions.some(same)) db.reactions = db.reactions.filter((x) => !same(x))
    else db.reactions.push({ ...r, groupCode })
    save(db)
  },
}

/* ---------------- Supabase ---------------- */

function supaStore(sb: SupabaseClient): Store {
  const ok = <T>(res: { data: T; error: unknown }) => {
    if (res.error) throw res.error
    return res.data
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const toProfile = (r: any): Profile => ({
    id: r.id, name: r.name, avatar: r.avatar, groupCode: r.group_code,
    bodyWeight: r.body_weight ?? undefined, createdAt: r.created_at,
  })
  const toWorkout = (r: any): Workout => ({
    id: r.id, userId: r.user_id, groupCode: r.group_code, performedAt: r.performed_at,
    type: r.type, durationMin: r.duration_min, calories: r.calories,
    exercises: r.exercises ?? [], notes: r.notes ?? undefined, createdAt: r.created_at,
  })
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return {
    mode: 'supabase',
    async getGroup(code) {
      const data = ok(await sb.from('groups').select('*').eq('code', code).maybeSingle())
      return data ? { code: data.code, name: data.name } : null
    },
    async createGroup(g) {
      ok(await sb.from('groups').insert({ code: g.code, name: g.name }))
    },
    async getProfiles(code) {
      return (ok(await sb.from('profiles').select('*').eq('group_code', code)) ?? []).map(toProfile)
    },
    async upsertProfile(p) {
      ok(await sb.from('profiles').upsert({
        id: p.id, name: p.name, avatar: p.avatar, group_code: p.groupCode,
        body_weight: p.bodyWeight ?? null, created_at: p.createdAt,
      }))
    },
    async getWorkouts(code) {
      return (ok(await sb.from('workouts').select('*').eq('group_code', code).order('performed_at')) ?? []).map(toWorkout)
    },
    async addWorkout(w) {
      ok(await sb.from('workouts').insert({
        id: w.id, user_id: w.userId, group_code: w.groupCode, performed_at: w.performedAt,
        type: w.type, duration_min: w.durationMin, calories: w.calories,
        exercises: w.exercises, notes: w.notes ?? null, created_at: w.createdAt,
      }))
    },
    async deleteWorkout(id) {
      ok(await sb.from('workouts').delete().eq('id', id))
    },
    async getReactions(code) {
      const rows = ok(await sb.from('reactions').select('*').eq('group_code', code)) ?? []
      return rows.map((r: { workout_id: string; user_id: string; emoji: string }) => ({
        workoutId: r.workout_id, userId: r.user_id, emoji: r.emoji,
      }))
    },
    async toggleReaction(r, groupCode) {
      const existing = ok(await sb.from('reactions').select('workout_id')
        .eq('workout_id', r.workoutId).eq('user_id', r.userId).eq('emoji', r.emoji))
      if (existing && existing.length) {
        ok(await sb.from('reactions').delete()
          .eq('workout_id', r.workoutId).eq('user_id', r.userId).eq('emoji', r.emoji))
      } else {
        ok(await sb.from('reactions').insert({ workout_id: r.workoutId, user_id: r.userId, emoji: r.emoji, group_code: groupCode }))
      }
    },
  }
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const store: Store = url && key ? supaStore(createClient(url, key)) : localStore

/* ---------------- Sessão (quem sou eu neste aparelho) ---------------- */

const SESSION = 'levelup-session'
export function getSession(): { userId: string; groupCode: string } | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION) || 'null')
  } catch {
    return null
  }
}
export function setSession(s: { userId: string; groupCode: string } | null) {
  if (s) localStorage.setItem(SESSION, JSON.stringify(s))
  else localStorage.removeItem(SESSION)
}

export function newGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/* ---------------- Demo (modo local) ---------------- */

export async function seedDemo(groupCode: string) {
  const friends = [
    { name: 'Rafa', avatar: '🦁', freq: 0.8, kind: 'musculacao' },
    { name: 'Bia', avatar: '🐺', freq: 0.65, kind: 'corrida' },
    { name: 'Dudu', avatar: '🐻', freq: 0.45, kind: 'cross' },
  ]
  const now = new Date()
  for (const f of friends) {
    const p: Profile = { id: uid(), name: f.name, avatar: f.avatar, groupCode, createdAt: now.toISOString() }
    await store.upsertProfile(p)
    for (let d = 40; d >= 0; d--) {
      if (Math.random() > f.freq) continue
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, 6 + Math.floor(Math.random() * 16), 0)
      if (date > now) continue
      const strength = f.kind === 'musculacao' || Math.random() < 0.3
      const dur = 40 + Math.floor(Math.random() * 50)
      await store.addWorkout({
        id: uid(), userId: p.id, groupCode, performedAt: date.toISOString(),
        type: strength ? 'musculacao' : f.kind, durationMin: dur,
        calories: Math.round(dur * (strength ? 6 : 10)),
        exercises: strength
          ? [
              { name: 'Supino reto', sets: 4, reps: 10, weight: 50 + Math.floor(Math.random() * 40) },
              { name: 'Agachamento livre', sets: 4, reps: 8, weight: 60 + Math.floor(Math.random() * 60) },
              { name: 'Remada curvada', sets: 3, reps: 12, weight: 40 + Math.floor(Math.random() * 20) },
            ]
          : [],
        createdAt: date.toISOString(),
      })
    }
  }
}
