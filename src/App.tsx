import { useState } from 'react'
import { earnedMedals, type Medal } from './game'
import { getSession, setSession, store } from './storage'
import type { Workout } from './types'
import { buildPlayers, useGroup } from './useGroup'
import Onboarding from './components/Onboarding'
import Home from './components/Home'
import Feed from './components/Feed'
import Ranking from './components/Ranking'
import Medals from './components/Medals'
import ProfileView from './components/Profile'
import WorkoutForm from './components/WorkoutForm'
import Celebration, { type CelebrationData } from './components/Celebration'

type Tab = 'home' | 'feed' | 'ranking' | 'medals' | 'profile'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Início' },
  { id: 'feed', icon: '📣', label: 'Feed' },
  { id: 'ranking', icon: '🏆', label: 'Ranking' },
  { id: 'medals', icon: '🎖️', label: 'Medalhas' },
  { id: 'profile', icon: '👤', label: 'Perfil' },
]

export default function App() {
  const [session, setSess] = useState(getSession)
  if (!session) {
    return (
      <Onboarding
        onDone={(s) => {
          setSession(s)
          setSess(s)
        }}
      />
    )
  }
  return (
    <Main
      key={session.groupCode + session.userId}
      userId={session.userId}
      groupCode={session.groupCode}
      onLogout={() => {
        setSession(null)
        setSess(null)
      }}
    />
  )
}

function Main({ userId, groupCode, onLogout }: { userId: string; groupCode: string; onLogout: () => void }) {
  const data = useGroup(groupCode)
  const [tab, setTab] = useState<Tab>('home')
  const [logging, setLogging] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationData | null>(null)

  const me = data.players.find((p) => p.profile.id === userId)

  if (data.loading) return <div className="splash">Carregando… 💪</div>
  if (!me) {
    return (
      <div className="splash">
        <p>Perfil não encontrado neste grupo.</p>
        {data.error && <p className="muted">{data.error}</p>}
        <button className="btn" onClick={onLogout}>Voltar</button>
      </div>
    )
  }

  async function saveWorkout(w: Workout) {
    const before = me!
    await store.addWorkout(w)
    const res = await data.reload()
    if (!res) return
    const after = buildPlayers(res.profiles, res.workouts).find((p) => p.profile.id === userId)
    if (!after) return
    const prev = new Set(before.medals.map((m) => m.id))
    const newMedals: Medal[] = earnedMedals(after.stats).filter((m) => !prev.has(m.id))
    const scored = after.scored.find((s) => s.id === w.id)
    const prs = Object.entries(after.stats.prs)
      .filter(([k, v]) => v > 0 && v > (before.stats.prs[k] ?? 0) && before.stats.prs[k] !== undefined)
      .map(([k, v]) => ({ name: k, weight: v }))
    setLogging(false)
    setCelebration({
      xp: scored?.xp,
      levelBefore: before.level.level,
      levelAfter: after.level.level,
      tierAfter: after.tier,
      tierChanged: after.tier.title !== before.tier.title,
      newMedals,
      prs,
      streak: after.stats.currentStreak,
    })
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⚡</span> LevelUp
        </div>
        <div className="group-pill" title="Código do grupo">
          {data.group?.name ?? 'Grupo'} · <b>{groupCode}</b>
        </div>
      </header>

      {store.mode === 'local' && (
        <div className="banner">
          Modo local: os dados ficam só neste aparelho. Configure o Supabase para jogar com os amigos.
        </div>
      )}
      {data.error && <div className="banner error">{data.error}</div>}

      <main className="content">
        {tab === 'home' && <Home me={me} players={data.players} onLog={() => setLogging(true)} onGo={setTab} />}
        {tab === 'feed' && (
          <Feed
            me={me}
            players={data.players}
            reactions={data.reactions}
            onReact={async (workoutId, emoji) => {
              await store.toggleReaction({ workoutId, userId, emoji }, groupCode)
              data.reload()
            }}
            onDelete={async (id) => {
              if (!confirm('Apagar este treino? O XP será removido.')) return
              await store.deleteWorkout(id)
              data.reload()
            }}
          />
        )}
        {tab === 'ranking' && <Ranking me={me} players={data.players} />}
        {tab === 'medals' && <Medals me={me} players={data.players} />}
        {tab === 'profile' && (
          <ProfileView
            me={me}
            group={data.group}
            onSave={async (p) => {
              await store.upsertProfile(p)
              data.reload()
            }}
            onLogout={onLogout}
          />
        )}
      </main>

      <button className="fab" onClick={() => setLogging(true)} aria-label="Registrar treino">
        ＋
      </button>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>
            <small>{t.label}</small>
          </button>
        ))}
      </nav>

      {logging && (
        <WorkoutForm
          me={me}
          onCancel={() => setLogging(false)}
          onSave={saveWorkout}
        />
      )}
      {celebration && <Celebration data={celebration} onClose={() => setCelebration(null)} />}
    </div>
  )
}
