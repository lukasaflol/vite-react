import { useEffect, useRef, useState, type ReactNode } from 'react'
import { config as C, brl } from './config'
import './App.css'

/* ---------------- hooks ---------------- */

function useCountdown(target: string) {
  const end = new Date(target).getTime()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, end - now)
  const s = Math.floor(diff / 1000)
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    acabou: diff === 0,
  }
}
const p2 = (n: number) => String(n).padStart(2, '0')

function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVis(e.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, vis] as const
}

function useStepper(total: number, ms: number, active: boolean) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setTimeout(() => setI((v) => (v + 1 < total ? v + 1 : v)), ms)
    return () => clearTimeout(id)
  }, [i, total, ms, active])
  return [i, setI] as const
}

/* ---------------- peças ---------------- */

const Ac = ({ children }: { children: ReactNode }) => <span className="ac">{children}</span>

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [ref, vis] = useInView<HTMLDivElement>(0.15)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (vis) setShown(true)
  }, [vis])
  return (
    <div ref={ref} className={`reveal ${shown ? 'in' : ''} ${className}`}>
      {children}
    </div>
  )
}

function CTA({ secundario }: { secundario?: boolean }) {
  return (
    <div className="cta-bloco">
      <div className="cta-linha">
        <a className="btn" href={C.checkoutUrl}>
          Quero o {C.produto}
        </a>
        {secundario && (
          <a className="btn btn-sec" href="#como-funciona">
            Ver como funciona
          </a>
        )}
      </div>
      <p className="cta-nota">
        R$ {brl(C.precoPor)} ou {C.parcelas}x de R$ {brl(C.valorParcela)} · Garantia de {C.garantiaDias} dias
        <br />
        <span className="tx2">
          {C.campanha}: de <s>R$ {C.precoDe}</s> por <b>R$ {C.precoPor}</b> até {C.fimOfertaCurto}
          {C.bonus.ativo && <> · Bônus: concorra a {C.bonus.titulo}</>}
        </span>
      </p>
    </div>
  )
}

function Marquee() {
  const item = (
    <>
      <span>{C.campanha}</span>
      <i>●</i>
      <span>
        De <s>R$ {C.precoDe}</s> por <b>R$ {C.precoPor}</b>
      </span>
      <i>●</i>
      <span>Só até {C.fimOfertaCurto}</span>
      <i>●</i>
      <span className="ac">{C.marca}</span>
      <i>●</i>
    </>
  )
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">
        {Array.from({ length: 8 }, (_, k) => (
          <span key={k} className="marquee-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

/* Um "vídeo" simulado: quadro vertical com legenda palavra por palavra */
function FakeReel({ frase, estilo = 'legenda', play = true }: { frase: string; estilo?: string; play?: boolean }) {
  const palavras = frase.split(' ')
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!play) return
    const id = setInterval(() => setW((v) => (v + 1) % (palavras.length + 3)), 380)
    return () => clearInterval(id)
  }, [play, palavras.length])
  return (
    <div className={`reel reel--${estilo}`}>
      <div className="reel-pessoa" />
      {estilo === 'impacto' && <div className="reel-impacto">{palavras[Math.min(w, palavras.length - 1)]}</div>}
      {estilo === 'gancho' && <div className="reel-gancho">{frase}</div>}
      {estilo === 'checklist' && (
        <ul className="reel-check">
          {['Grave', 'Mande', 'Poste'].map((t, k) => (
            <li key={t} className={w > k * 2 ? 'on' : ''}>
              ✓ {t}
            </li>
          ))}
        </ul>
      )}
      {estilo === 'painel' && <div className="reel-painel">{C.produto}</div>}
      {estilo === 'verde' && <div className="reel-cenario" />}
      <div className="reel-legenda">
        {palavras.map((p, k) => (
          <span key={k} className={k === w ? 'on' : k < w ? 'dito' : ''}>
            {p}{' '}
          </span>
        ))}
      </div>
      <div className="reel-barra">
        <div style={{ width: `${(Math.min(w, palavras.length) / palavras.length) * 100}%` }} />
      </div>
    </div>
  )
}

/* ---------------- seções ---------------- */

function Topo() {
  const t = useCountdown(C.fimOferta)
  return (
    <header className="topo">
      <div className="topo-in">
        <b className="topo-logo">{C.marca}</b>
        <span className="topo-promo">
          <span className="selo">{C.campanha}</span>
          <span className="hide-sm">
            De <s>R$ {C.precoDe}</s> por <b>R$ {C.precoPor}</b> ·
          </span>{' '}
          termina em{' '}
          <b className="mono">
            {t.d}d {p2(t.h)}:{p2(t.m)}:{p2(t.s)}
          </b>
        </span>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="inicio" className="hero">
      <Reveal>
        <div className="pilula">
          {C.campanha} · <b>{Math.round((1 - C.precoPor / C.precoDe) * 100)}% OFF</b> · só até {C.fimOfertaTexto}
        </div>
        <h1>
          Cole um arquivo na sua IA e ela vira <Ac>sua editora de vídeo</Ac>.
        </h1>
        <p className="lead">
          O {C.produto} é uma inteligência de edição para o ChatGPT e o Claude. Do Reels ao vídeo longo do YouTube: você
          manda a gravação, pede em português e recebe o vídeo editado.
        </p>
      </Reveal>
      <Reveal className="hero-midia">
        <div className="moldura">
          <FakeReel frase="Você grava, a sua IA edita e você só posta." />
        </div>
      </Reveal>
      <CTA secundario />
    </section>
  )
}

const PASSOS_DEMO = [
  'Ouvindo a sua gravação.',
  'Achei 6 pausas e 2 tomadas repetidas.',
  'Tirei o que sobrava. 21 s viraram 12 s.',
  'Escrevi a legenda no tempo da sua fala.',
  'Pronto pra postar.',
]
// segmentos da gravação bruta: f = fala, p = pausa, r = tomada repetida
const SEGS: [string, number][] = [
  ['f', 2], ['p', 1], ['f', 2.5], ['r', 2], ['p', 1.2], ['f', 2], ['p', 0.8], ['f', 1.5],
  ['r', 1.8], ['p', 1], ['f', 2], ['p', 1.2], ['f', 2], ['p', 1],
]

function DemoIA() {
  const [ref, vis] = useInView<HTMLElement>(0.4)
  const [i, setI] = useStepper(PASSOS_DEMO.length, 1800, vis)
  const cortado = i >= 2
  return (
    <section ref={ref} id="timeline" className="secao">
      <Reveal>
        <h2>
          Veja a IA <Ac>editando</Ac>.
        </h2>
        <p className="sub">Uma gravação de verdade, editada na sua frente.</p>
      </Reveal>
      <div className="demo">
        <div className="demo-status">
          <span className="tx3">
            Passo {i + 1} de {PASSOS_DEMO.length}
          </span>
          <p key={i} className="fade">
            {PASSOS_DEMO[i]}
          </p>
        </div>
        <div className="trilhas">
          {(['Vídeo', 'Fala', 'Legenda'] as const).map((nome, row) => (
            <div key={nome} className="trilha">
              <span className="trilha-nome">{nome}</span>
              <div className="trilha-segs">
                {SEGS.map(([t, d], k) => {
                  const fora = cortado && t !== 'f'
                  const mostraLeg = row === 2 && i < 3
                  return (
                    <div
                      key={k}
                      className={`seg seg-${t} ${fora ? 'fora' : ''} ${i === 1 && t !== 'f' ? 'marca' : ''} ${mostraLeg ? 'vazio' : ''}`}
                      style={{ flexGrow: fora ? 0.0001 : d }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="demo-tempos">
          <span>
            bruto <b>0:21</b>
          </span>
          <span>→</span>
          <span>
            pronto <b className="ac">{cortado ? '0:12' : '…'}</b>
          </span>
          <button className="link" onClick={() => setI(0)}>
            Ver de novo
          </button>
        </div>
      </div>
      <CTA secundario />
    </section>
  )
}

function ComoFunciona() {
  const [ref, vis] = useInView<HTMLElement>(0.35)
  const [i, setI] = useStepper(6, 1500, vis)
  const passo = i < 3 ? 0 : i < 5 ? 1 : 2
  return (
    <section ref={ref} id="como-funciona" className="secao">
      <Reveal>
        <h2>
          Editar virou <Ac>conversa</Ac>.
        </h2>
        <p className="sub">Você escreve pra sua IA como escreveria pra uma pessoa. Ela cuida da edição.</p>
      </Reveal>
      <div className="duas">
        <ol className="passos">
          {[
            ['Solte o arquivo na conversa.', 'A sua IA faz a instalação e avisa a cada passo.'],
            ['Mande a gravação e diga o que quer.', 'Em português, do seu jeito. Sem comando pra decorar.'],
            ['O vídeo volta editado.', 'Faltou alguma coisa? Peça o ajuste ali mesmo.'],
          ].map(([t, d], k) => (
            <li key={k} className={passo === k ? 'on' : ''}>
              <button onClick={() => setI([0, 3, 5][k])}>
                <span className="num">{k + 1}</span>
                <span>
                  <b>{t}</b>
                  <br />
                  <span className="tx2">{d}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="chat">
          <div className="chat-topo">
            Sua IA <span className="tx3">Claude ou ChatGPT</span>
          </div>
          <div className="chat-corpo">
            {i >= 0 && (
              <div className="msg eu arquivo fade">
                🗂️ {C.arquivoZip} <small>Arquivo zip</small>
              </div>
            )}
            {i >= 1 && <div className="msg ia fade">Recebi. Vou instalar o {C.produto} aqui.</div>}
            {i >= 2 && <div className="msg ia fade">Instalado. Pode mandar a sua gravação.</div>}
            {i >= 3 && (
              <div className="msg eu arquivo fade">
                🎬 Gravação de 1:24
              </div>
            )}
            {i >= 4 && <div className="msg eu fade">Corta as pausas e fica com a última tomada</div>}
            {i >= 5 && (
              <div className="msg ia fade">
                Tirei as pausas e as tomadas repetidas, e já pus legenda e motion. <b>1:24</b> virou{' '}
                <b className="ac">0:44</b>.
                <div className="msg-video">▶ vídeo pronto · 0:44</div>
              </div>
            )}
          </div>
          <div className="chat-input">Escreva ou solte um arquivo</div>
        </div>
      </div>
    </section>
  )
}

const ESTILOS = [
  { nome: 'Legenda animada', pedido: 'Legenda palavra por palavra', estilo: 'legenda', frase: 'Legenda que acompanha a boca' },
  { nome: 'Gancho na tela', pedido: 'Põe a primeira frase grande na tela', estilo: 'gancho', frase: 'Pare de editar na mão' },
  { nome: 'Palavra de impacto', pedido: 'Destaca as palavras fortes atrás de mim', estilo: 'impacto', frase: 'Isso muda tudo hoje' },
  { nome: 'Checklist', pedido: 'Faz um checklist que entra quando eu falo', estilo: 'checklist', frase: 'Grave mande e poste' },
  { nome: 'Painel flutuante', pedido: 'Põe um painel com o nome do produto', estilo: 'painel', frase: 'Olha o que ela faz' },
  { nome: 'Sem pano verde', pedido: 'Tira o fundo e põe um cenário', estilo: 'verde', frase: 'Troquei de cenário sem pano verde' },
]

function Estilos() {
  const [i, setI] = useState(0)
  const [ref, vis] = useInView<HTMLElement>(0.4)
  const go = (d: number) => setI((v) => (v + d + ESTILOS.length) % ESTILOS.length)
  useEffect(() => {
    if (!vis) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [vis])
  const startX = useRef<number | null>(null)
  const e = ESTILOS[i]
  return (
    <section ref={ref} className="secao">
      <Reveal>
        <h2>
          Um <Ac>pedido</Ac> pra cada estilo.
        </h2>
        <p className="sub">Do mais simples, só com legenda, ao motion completo. Arraste pro lado e veja o pedido de cada um.</p>
      </Reveal>
      <div
        className="carrossel"
        onPointerDown={(ev) => (startX.current = ev.clientX)}
        onPointerUp={(ev) => {
          if (startX.current === null) return
          const dx = ev.clientX - startX.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          startX.current = null
        }}
      >
        <button className="seta" aria-label="Estilo anterior" onClick={() => go(-1)}>
          ‹
        </button>
        <div className="carrossel-item" key={i}>
          <div className="moldura pequena">
            <FakeReel frase={e.frase} estilo={e.estilo} />
          </div>
          <div className="carrossel-info">
            <b>{e.nome}</b>
            <p>
              <span className="tx3">Pedido:</span> “{e.pedido}”
            </p>
            <span className="tx3">
              {i + 1} de {ESTILOS.length}
            </span>
          </div>
        </div>
        <button className="seta" aria-label="Próximo estilo" onClick={() => go(1)}>
          ›
        </button>
      </div>
      <div className="dots">
        {ESTILOS.map((_, k) => (
          <button key={k} className={k === i ? 'on' : ''} aria-label={`Estilo ${k + 1}`} onClick={() => setI(k)} />
        ))}
      </div>
    </section>
  )
}

function AntesDepois() {
  const [pos, setPos] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const drag = (x: number) => {
    const r = box.current!.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)))
  }
  return (
    <section className="secao">
      <Reveal>
        <h2>
          40 segundos a <Ac>menos</Ac>. A mesma fala.
        </h2>
        <p className="sub">O que saiu foi pausa e tomada repetida.</p>
      </Reveal>
      <div
        ref={box}
        className="comparar"
        onPointerDown={(e) => {
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
          drag(e.clientX)
        }}
        onPointerMove={(e) => e.buttons && drag(e.clientX)}
      >
        <div className="comp-lado comp-bruto">
          <span className="etq">Bruto 1:24</span>
          <p>
            então… <i>[pausa]</i> o que eu queria dizer é… <i>[repete]</i> o que eu queria dizer é que editar…
          </p>
        </div>
        <div className="comp-lado comp-pronto" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <span className="etq etq-d">Editado 0:44</span>
          <p>
            O que eu queria dizer é que <b className="ac">editar virou conversa</b>.
          </p>
        </div>
        <div className="comp-alca" style={{ left: `${pos}%` }}>
          <span>⇆</span>
        </div>
      </div>
      <p className="tx3 centro">Arraste a ponta</p>
    </section>
  )
}

function Longos() {
  return (
    <section className="secao">
      <Reveal>
        <h2>
          Vídeo longo <Ac>também</Ac>.
        </h2>
        <p className="sub">Vlog pro YouTube, aula gravada. Você manda as gravações, diz o que quer e recebe o vídeo montado.</p>
      </Reveal>
      <div className="grade2">
        {[
          ['Vlog pro YouTube', 'Edita pro YouTube com os melhores momentos. Onde eu não falo, põe música.', '5 dias gravados', '13:09'],
          ['Aula gravada', 'Transforma essa aula num vídeo de 10 minutos pro YouTube.', '2h04 de aula', '9:05'],
        ].map(([t, ped, de, para]) => (
          <Reveal key={t} className="cartao">
            <div className="thumb-wide">
              <div className="play">▶</div>
            </div>
            <b>{t}</b>
            <p className="tx2">
              <span className="tx3">Pedido:</span> “{ped}”
            </p>
            <p className="conv">
              {de} → <b className="ac">{para}</b> de vídeo
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const FUNCOES = [
  ['Corte de pausas e erros', 'A pausa longa e a frase errada vão embora. Fica a fala limpa.'],
  ['Melhor tomada', 'Gravou duas vezes? Fica a melhor.'],
  ['Legenda palavra por palavra', 'A palavra acende quando é dita.'],
  ['Gancho na tela', 'A primeira frase, em letra grande.'],
  ['Palavra de impacto', 'Entra grande, por trás de você.'],
  ['Recorte sem pano verde', 'Tira o fundo e põe outro cenário.'],
  ['Checklist e motion no tempo da fala', 'O item entra quando você fala.'],
  ['Trilha e efeitos sonoros', 'A trilha abaixa quando você fala. O efeito entra junto com a animação.'],
]

function Funcoes() {
  const [i, setI] = useState(0)
  return (
    <section id="conteudo" className="secao">
      <Reveal>
        <h2>
          O que ela faz com a sua <Ac>gravação</Ac>.
        </h2>
        <p className="sub">Oito funções. Toque em cada uma.</p>
      </Reveal>
      <div className="duas">
        <ul className="funcoes">
          {FUNCOES.map(([t, d], k) => (
            <li key={k} className={k === i ? 'on' : ''}>
              <button onClick={() => setI(k)}>
                <span className="num">{p2(k + 1)}</span>
                <span>
                  <b>{t}</b>
                  {k === i && <span className="tx2 bloco">{d}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="moldura pequena">
          <FakeReel
            key={i}
            frase={FUNCOES[i][0]}
            estilo={['legenda', 'legenda', 'legenda', 'gancho', 'impacto', 'verde', 'checklist', 'painel'][i]}
          />
        </div>
      </div>
    </section>
  )
}

function OQueRecebe() {
  return (
    <section className="secao">
      <Reveal>
        <h2>O que você recebe.</h2>
        <p className="sub">
          Três peças. O acesso chega por <b>e-mail</b>, na hora.
        </p>
      </Reveal>
      <div className="grade3">
        {[
          ['⚙️', C.produto, 'Uma inteligência de edição pra sua IA. Tira as pausas, fica com a melhor tomada, legenda, anima e põe motion.'],
          ['🗂️', 'Arquivo zip', 'Tudo que o ChatGPT ou o Claude precisa pra editar de forma profissional.'],
          ['🎓', 'Aulas curtas', 'Pra instalar e fazer o primeiro vídeo, no computador e pelo celular. Com pedidos prontos e catálogo de estilos.'],
        ].map(([ic, t, d]) => (
          <Reveal key={t} className="cartao">
            <div className="icone">{ic}</div>
            <b>{t}</b>
            <p className="tx2">{d}</p>
          </Reveal>
        ))}
      </div>
      <p className="centro destaque">
        Não é um curso de edição. <Ac>Quem edita é a IA.</Ac>
      </p>
      <CTA />
    </section>
  )
}

function ParaQuem() {
  const [i, setI] = useState<number | null>(null)
  const itens = [
    ['Quem cria conteúdo', 'Tem gravação parada no celular, esperando o dia de editar.'],
    ['Quem anuncia', 'Sua campanha vive pedindo criativo novo. Cada um é mais uma edição.'],
    ['Quem ensina', 'Você grava a aula inteira, e ela precisa chegar limpa no aluno.'],
    ['Quem paga editor', 'Você manda pro editor, paga e espera o vídeo voltar.'],
  ]
  return (
    <section className="secao">
      <Reveal>
        <h2>Feito pra quem grava.</h2>
        <p className="sub">E pra quem a edição anda pesando. Toque numa frase pra acender só ela.</p>
      </Reveal>
      <div className={`frases ${i !== null ? 'foco' : ''}`}>
        {itens.map(([t, d], k) => (
          <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k === i ? null : k)}>
            <b>{t}:</b> {d}
          </button>
        ))}
      </div>
      <p className="centro destaque">
        Nas quatro rotinas, quem edita passa a ser a sua <Ac>IA</Ac>.
      </p>
      <CTA />
    </section>
  )
}

function Criador() {
  return (
    <section className="secao">
      <div className="criador">
        <div className="criador-foto">
          {C.criador.foto ? <img src={C.criador.foto} alt={C.criador.nome} /> : <span>Sua foto</span>}
        </div>
        <div>
          <h2>
            Sou <Ac>eu</Ac> nos vídeos desta página.
          </h2>
          <p>
            <b>{C.criador.nome}</b> <span className="tx3">· {C.criador.cargo}</span>
          </p>
          <p className="tx2">Eu gravei. A edição é do {C.produto}.</p>
        </div>
      </div>
    </section>
  )
}

function Bonus() {
  if (!C.bonus.ativo) return null
  return (
    <section className="secao">
      <Reveal className="bonus">
        <span className="selo">Bônus da {C.campanha}</span>
        <h2>
          Comprou na {C.campanha}, concorre a <Ac>{C.bonus.titulo}</Ac>.
        </h2>
        <p className="sub">Até {C.fimOfertaTexto}, cada compra ganha um número da sorte.</p>
        <div className="grade2">
          <div className="cartao">
            <span className="num">1</span>
            <b>Compre até {C.fimOfertaCurto}</b>
            <p className="tx2">Vale a compra com pagamento aprovado até as 23h59.</p>
          </div>
          <div className="cartao">
            <span className="num">2</span>
            <b>Receba seu número da sorte</b>
            <p className="tx2">Ele chega no e-mail da compra, junto com o acesso.</p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Contador({ grande }: { grande?: boolean }) {
  const t = useCountdown(C.fimOferta)
  return (
    <div className={`contador ${grande ? 'g' : ''}`}>
      {(
        [
          [t.d, 'dias'],
          [t.h, 'horas'],
          [t.m, 'min'],
          [t.s, 'seg'],
        ] as const
      ).map(([v, l]) => (
        <div key={l}>
          <b className="mono">{p2(v)}</b>
          <span>{l}</span>
        </div>
      ))}
    </div>
  )
}

function Preco() {
  const [modo, setModo] = useState<'vista' | 'parc'>('parc')
  return (
    <section id="comprar" className="secao">
      <Reveal>
        <h2>
          Leve o {C.produto}. Preço de <Ac>{C.campanha}</Ac>.
        </h2>
        <p className="sub">
          As três peças por um preço só. De R$ {C.precoDe} por R$ {C.precoPor}, só até {C.fimOfertaTexto}.
        </p>
      </Reveal>
      <div className="preco-wrap">
        <p className="tx3 centro">{C.campanha} acaba em</p>
        <Contador grande />
        <div className="preco">
          <b className="preco-marca">{C.marca}</b>
          <span className="tx2 bloco">{C.slogan}</span>
          <div className="toggle">
            <button className={modo === 'vista' ? 'on' : ''} onClick={() => setModo('vista')}>
              À vista
            </button>
            <button className={modo === 'parc' ? 'on' : ''} onClick={() => setModo('parc')}>
              Em {C.parcelas}x
            </button>
          </div>
          <p className="de">
            De <s>R$ {C.precoDe}</s> <span className="selo">{Math.round((1 - C.precoPor / C.precoDe) * 100)}% OFF</span>
          </p>
          {modo === 'parc' ? (
            <>
              <p className="valor">
                <small>{C.parcelas}x</small> R$ {brl(C.valorParcela)}
              </p>
              <p className="tx2">ou R$ {C.precoPor} à vista</p>
            </>
          ) : (
            <>
              <p className="valor">R$ {C.precoPor}</p>
              <p className="tx2">
                ou {C.parcelas}x de R$ {brl(C.valorParcela)}
              </p>
            </>
          )}
          <a className="btn btn-full" href={C.checkoutUrl}>
            Quero o {C.produto}
          </a>
          <p className="tx3 pequeno">{C.alunos} já compraram comigo · PIX, Apple Pay ou cartão</p>
          <ul className="inclui">
            <li>
              <b>{C.produto}</b> Tira as pausas, fica com a melhor tomada, legenda, anima e põe motion.
            </li>
            <li>
              <b>Arquivo zip</b> Tudo que o ChatGPT ou o Claude precisa pra editar.
            </li>
            <li>
              <b>Aulas curtas</b> Pra instalar e fazer o primeiro vídeo.
            </li>
            <li>
              <b>Acesso na hora, por e-mail</b> Vale por {C.acessoMeses / 12} ano.
            </li>
          </ul>
          <p className="tx3 pequeno">
            Funciona no computador (Mac ou Windows) com Claude ou ChatGPT, e pelo celular com ChatGPT, sempre no plano
            pago. Essa assinatura é paga à parte.
          </p>
        </div>
        <div className="garantia">
          <div className="garantia-selo">{C.garantiaDias}</div>
          <div>
            <b>Garantia de {C.garantiaDias} dias</b>
            <p className="tx2">Se não funcionar pra você ou se você não gostar, peça o reembolso. Você recebe tudo de volta.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Depoimentos() {
  return (
    <section className="secao">
      <Reveal>
        <h2>Quem comprou, já está editando.</h2>
        <p className="sub">{C.alunos} já compraram. Estes são prints de quem comprou.</p>
      </Reveal>
      <div className="grade3">
        {C.depoimentos.map((d) => (
          <div key={d.autor} className="cartao depo">
            {d.imagem ? <img src={d.imagem} alt={`Depoimento de ${d.autor}`} /> : <div className="depo-vazio">Print do depoimento</div>}
            <span className="tx3">
              {d.autor} · {d.origem}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

const FAQ: [string, ReactNode][] = [
  [
    `Como funciona a ${C.campanha}?`,
    <>
      Até {C.fimOfertaTexto}, o {C.marca} sai de R$ {C.precoDe} por R$ {C.precoPor}, ou {C.parcelas}x de R${' '}
      {brl(C.valorParcela)}. É o mesmo produto, com o mesmo acesso e a mesma garantia.
    </>,
  ],
  ...(C.bonus.ativo
    ? ([
        [
          'Quais são as regras do sorteio?',
          <>
            Participa quem comprar até {C.fimOfertaTexto}, com pagamento aprovado. Vale 1 número da sorte por compra. Se a
            compra for reembolsada, o número é cancelado. O ganhador sai no {C.bonus.dataSorteio}.{' '}
            <a href={C.regulamentoUrl}>Regulamento completo</a>
          </>,
        ],
      ] as [string, ReactNode][])
    : []),
  [
    `O que é o ${C.produto}?`,
    <>
      É uma skill de edição de vídeo que a sua IA usa pra editar seus vídeos, no computador ou pelo celular. Serve pro
      Claude e pro ChatGPT. Você manda a gravação, escreve o pedido em português e volta um vídeo cortado, com legenda e
      motion.
    </>,
  ],
  ['Preciso de computador?', 'Não. Funciona no computador (Mac ou Windows 64 bits) e também pelo celular.'],
  [
    'Funciona pelo celular?',
    'Funciona, pelo app do ChatGPT no plano pago. Vai bem em vídeos de até uns 90 segundos. Efeitos pesados e vídeos longos ficam melhores no computador.',
  ],
  [
    'Quanto custa a assinatura da IA?',
    `Você precisa de um plano pago do Claude ou do ChatGPT, contratado direto com eles. Esse valor não entra nos R$ ${C.precoPor}.`,
  ],
  [
    'Que vídeo funciona melhor?',
    'Vídeo falado. Reels, TikTok e anúncio, de 20 a 90 segundos, ficam prontos mais rápido. Vídeo longo também dá, mas leva mais tempo.',
  ],
  [
    'Meus vídeos vão pra internet?',
    'No computador, o arquivo fica na sua pasta. Pra decidir o corte, a IA lê o texto da sua fala e algumas imagens, pela sua conta da IA.',
  ],
  ['Como recebo o acesso?', 'Por e-mail, na hora em que o pagamento é aprovado. Lá ficam o arquivo zip, as aulas, os pedidos prontos e o catálogo de estilos.'],
  [`Tem garantia?`, `Tem, de ${C.garantiaDias} dias. Se não gostar, é só pedir o reembolso.`],
]

function Perguntas() {
  const [aberta, setAberta] = useState<number | null>(0)
  return (
    <section className="secao">
      <Reveal>
        <h2>
          Respostas sem <Ac>rodeio</Ac>.
        </h2>
        <p className="sub">O que vale saber antes de comprar.</p>
      </Reveal>
      <div className="faq">
        {FAQ.map(([q, a], k) => (
          <div key={k} className={`faq-item ${aberta === k ? 'on' : ''}`}>
            <button aria-expanded={aberta === k} onClick={() => setAberta(aberta === k ? null : k)}>
              {q}
              <span className="mais">+</span>
            </button>
            <div className="faq-resp">
              <div>
                <p className="tx2">{a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Final() {
  const [pronto, setPronto] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setPronto((v) => !v), 2600)
    return () => clearInterval(id)
  }, [])
  return (
    <section className="secao final">
      <h2 className="final-frase">
        {pronto ? (
          <span className="fade">
            Você grava. Sua IA <Ac>edita</Ac>.
          </span>
        ) : (
          <span className="fade bruto">
            Você grava, <i>tomada repetida</i> Você grava. <i>pausa</i> Sua IA edi… <i>erro</i>
          </span>
        )}
      </h2>
      <p className="sub">O {C.produto} tira a pausa, o erro e a tomada repetida. Fica a fala que valeu.</p>
      <p className="tx3 centro">A {C.campanha} termina em</p>
      <Contador />
      <CTA />
    </section>
  )
}

function BarraFixa() {
  const [show, setShow] = useState(false)
  const t = useCountdown(C.fimOferta)
  useEffect(() => {
    const f = () => setShow(window.scrollY > 700)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return (
    <div className={`barra ${show ? 'on' : ''}`}>
      <div>
        <b>{C.produto}</b>{' '}
        <span className="tx2">
          <s>R$ {C.precoDe}</s> R$ {C.precoPor}
        </span>
        <br />
        <span className="tx3 mono">
          {C.campanha} · {t.d}d {p2(t.h)}:{p2(t.m)}:{p2(t.s)}
        </span>
      </div>
      <a className="btn" href={C.checkoutUrl}>
        Comprar
      </a>
    </div>
  )
}

export default function App() {
  return (
    <>
      <a className="pular" href="#inicio">
        Pular para o conteúdo
      </a>
      <Topo />
      <main>
        <Hero />
        <Marquee />
        <DemoIA />
        <ComoFunciona />
        <Estilos />
        <AntesDepois />
        <Longos />
        <Marquee />
        <Funcoes />
        <OQueRecebe />
        <ParaQuem />
        <Criador />
        <Marquee />
        <Bonus />
        <Preco />
        <Depoimentos />
        <Perguntas />
        <Final />
      </main>
      <footer className="rodape">
        <p>
          © 2026 {C.empresa}
        </p>
        <p className="tx3">
          ChatGPT é marca da OpenAI e Claude é marca da Anthropic. O {C.marca} é um produto independente, sem ligação com
          essas empresas.
        </p>
      </footer>
      <BarraFixa />
    </>
  )
}
