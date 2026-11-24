export interface Exercise {
  name: string
  sets: number
  reps: number
  weight: number // kg
}

export interface Workout {
  id: string
  userId: string
  groupCode: string
  performedAt: string // ISO datetime
  type: string
  durationMin: number
  calories: number
  exercises: Exercise[]
  notes?: string
  createdAt: string
}

export interface Profile {
  id: string
  name: string
  avatar: string
  groupCode: string
  bodyWeight?: number
  createdAt: string
}

export interface Group {
  code: string
  name: string
}

export interface Reaction {
  workoutId: string
  userId: string
  emoji: string
}
