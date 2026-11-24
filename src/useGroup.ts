import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  computeStats, earnedMedals, levelFromXP, scoreWorkouts, tierFor, weeklyChampions,
  type Medal, type ScoredWorkout, type UserStats,
} from './game'
import { store } from './storage'
import type { Group, Profile, Reaction, Workout } from './types'

export interface Player {
  profile: Profile
  scored: ScoredWorkout[]
  stats: UserStats
  level: ReturnType<typeof levelFromXP>
  tier: ReturnType<typeof tierFor>
  medals: Medal[]
}

export function buildPlayers(profiles: Profile[], workouts: Workout[]): Player[] {
  const byUser = new Map<string, ScoredWorkout[]>()
  for (const p of profiles) byUser.set(p.id, scoreWorkouts(workouts.filter((w) => w.userId === p.id)))
  const wins = weeklyChampions(byUser)
  return profiles.map((profile) => {
    const scored = byUser.get(profile.id) ?? []
    const stats = computeStats(scored, wins.get(profile.id) ?? 0)
    const level = levelFromXP(stats.xp)
    return { profile, scored, stats, level, tier: tierFor(level.level), medals: earnedMedals(stats) }
  })
}

export function useGroup(groupCode: string) {
  const [group, setGroup] = useState<Group | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [g, p, w, r] = await Promise.all([
        store.getGroup(groupCode),
        store.getProfiles(groupCode),
        store.getWorkouts(groupCode),
        store.getReactions(groupCode),
      ])
      setGroup(g)
      setProfiles(p)
      setWorkouts(w)
      setReactions(r)
      setError(null)
      return { profiles: p, workouts: w }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
      return null
    } finally {
      setLoading(false)
    }
  }, [groupCode])

  useEffect(() => {
    reload()
    const t = setInterval(reload, 30_000)
    const onFocus = () => reload()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', onFocus)
    }
  }, [reload])

  const players = useMemo(() => buildPlayers(profiles, workouts), [profiles, workouts])

  return { group, profiles, workouts, reactions, players, loading, error, reload }
}
