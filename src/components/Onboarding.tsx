import { useEffect, useState } from 'react'
import { newGroupCode, seedDemo, store, uid } from '../storage'
import type { Group, Profile } from '../types'

export const AVATARS = ['💪', '🦁', '🐺', '🐻', '🦍', '🐯', '🦅', '🐉', '🦈', '🐂', '🦊', '🐼', '🤖', '👽', '🔥', '⚡']

type Session = { userId: string; groupCode: string }

export default function Onboarding({ onDone }: { onDone: (s: Session) => void }) {
  const urlCode = new URLSearchParams(location.search).get('g')?.toUpperCase() ?? ''
  const [step, setStep] = useState<'start' | 'create' | 'join' | 'profile'>(urlCode ? 'join' : 'start')
  const [groupName, setGroupName] = useState('')
  const [code, setCode] = useState(urlCode)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [demo, setDemo] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function joinGroup(c: string) {
    setError('')
    setBusy(true)
    try {
      const g = await store.getGroup(c.trim().toUpperCase())
      if (!g) {
        setError('Grupo não encontrado. Confira o código.')
        return
      }
      setGroup(g)
      setMembers(await store.getProfiles(g.code))
      setStep('profile')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro de conexão')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (urlCode) joinGroup(urlCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createGroup() {
    if (!groupName.trim()) return setError('Dê um nome para o grupo')
    setBusy(true)
    try {
      const g = { code: newGroupCode(), name: groupName.trim() }
      await store.createGroup(g)
      setGroup(g)
      setMembers([])
      setStep('profile')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar grupo')
    } finally {
      setBusy(false)
    }
  }

  async function createProfile() {
    if (!group) return
    if (!name.trim()) return setError('Como seus amigos te chamam?')
    setBusy(true)
    try {
      const p: Profile = { id: uid(), name: name.trim(), avatar, groupCode: group.code, createdAt: new Date().toISOString() }
      await store.upsertProfile(p)
      if (demo) await seedDemo(group.code)
      history.replaceState(null, '', location.pathname)
      onDone({ userId: p.id, groupCode: group.code })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar perfil')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="onboarding">
      <div className="hero">
        <div className="hero-logo">⚡</div>
        <h1>LevelUp</h1>
        <p>Treine, ganhe XP, suba de nível e humilhe seus amigos no ranking.</p>
      </div>

      <div className="card">
        {step === 'start' && (
          <>
            <button className="btn primary block" onClick={() => setStep('create')}>Criar um grupo</button>
            <button className="btn block" onClick={() => setStep('join')}>Entrar com código</button>
          </>
        )}

        {step === 'create' && (
          <>
            <label>Nome do grupo</label>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex.: Os Marombas" autoFocus />
            <button className="btn primary block" disabled={busy} onClick={createGroup}>Criar</button>
            <button className="btn ghost block" onClick={() => setStep('start')}>Voltar</button>
          </>
        )}

        {step === 'join' && (
          <>
            <label>Código do grupo</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="code-input"
              autoFocus
            />
            <button className="btn primary block" disabled={busy || code.length < 6} onClick={() => joinGroup(code)}>
              Entrar
            </button>
            <button className="btn ghost block" onClick={() => setStep('start')}>Voltar</button>
          </>
        )}

        {step === 'profile' && group && (
          <>
            <h2>{group.name}</h2>
            <p className="muted">Código: <b>{group.code}</b></p>

            {members.length > 0 && (
              <>
                <label>Já tem perfil? Toque no seu</label>
                <div className="member-list">
                  {members.map((m) => (
                    <button key={m.id} className="member" onClick={() => onDone({ userId: m.id, groupCode: group.code })}>
                      <span className="avatar sm">{m.avatar}</span> {m.name}
                    </button>
                  ))}
                </div>
                <div className="divider">ou crie um novo</div>
              </>
            )}

            <label>Seu nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apelido" maxLength={20} />
            <label>Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map((a) => (
                <button key={a} className={`avatar-opt ${a === avatar ? 'sel' : ''}`} onClick={() => setAvatar(a)}>
                  {a}
                </button>
              ))}
            </div>
            {store.mode === 'local' && members.length === 0 && (
              <label className="check">
                <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
                Adicionar 3 amigos fictícios para testar
              </label>
            )}
            <button className="btn primary block" disabled={busy} onClick={createProfile}>Bora treinar! 🚀</button>
          </>
        )}

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  )
}
