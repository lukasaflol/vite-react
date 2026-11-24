# ⚡ LevelUp — competição de treinos entre amigos

App estilo GymRats, só que gamificado em **níveis**: cada treino vira XP, você sobe de nível,
ganha títulos e medalhas e disputa o ranking com a galera.

## O que conta pontos

| Critério | XP |
|---|---|
| Treino registrado | +30 |
| Tempo de treino | +1 por minuto (até 180 min) |
| Calorias | +1 a cada 10 kcal |
| Peso por exercício (volume = séries × reps × kg) | +1 a cada 250 kg (máx. 150) |
| Repetições | +1 a cada 10 reps (máx. 100) |
| **Streak** (dias seguidos sem faltar) | multiplicador +2% por dia, até +60% |
| 3º treino ou mais no mesmo dia | vale 50% (anti-farm) |

Regras ficam todas em [`src/game.ts`](src/game.ts) — é só mudar os números lá.

**Níveis:** XP para o nível N = `100 × (N−1)^1.6`. Títulos: Sedentário 🛋️ → Iniciante 🐣 → Frango 🐔 →
Marombeiro 💪 → Monstro 🦍 → Titã 🗿 → Olimpiano ⚡ → Lenda 👑 (nível 50).

**31 medalhas** em bronze/prata/ouro/diamante: constância, streak (3 a 100 dias), calorias, tempo,
carga (Clube dos 100 kg), volume total, repetições, madrugador, coruja, fim de semana,
modalidades e **Rei da Semana** (terminar a semana em 1º no grupo).

**Outras coisas:** ranking por XP/nível/calorias/tempo/peso/reps/treinos/streak (semana, mês, geral) com pódio;
feed com reações 🔥💪👏😱; recordes pessoais por exercício (avisa "NOVO RECORDE" enquanto você digita);
estimativa de calorias por modalidade; tela de comemoração com level up e medalhas novas; convite por link.

## Rodando localmente

```bash
npm install
npm run dev
```

Sem configuração, o app roda em **modo local** (dados só no navegador) — dá para marcar
"adicionar 3 amigos fictícios" ao criar o grupo e testar.

## Jogando com os amigos (Supabase, grátis)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, cole e rode [`supabase/schema.sql`](supabase/schema.sql).
3. Em *Project Settings → API*, copie a URL e a `anon public key`.
4. Copie `.env.example` para `.env.local` e preencha.
5. Publique (ex.: Vercel/Netlify, framework "Vite", build `npm run build`, pasta `dist`) com as mesmas
   duas variáveis de ambiente.
6. Crie o grupo e mande o link de convite (aba Perfil) para a galera. No celular, "Adicionar à tela inicial"
   instala como app.

> Não tem login com senha: quem tem o código do grupo entra e escolhe/cria o próprio perfil.
> É pensado para um grupo de amigos; para algo público, troque por Supabase Auth.
