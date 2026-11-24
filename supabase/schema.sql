-- LevelUp — schema do Supabase
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase e clique em "Run".

create table if not exists groups (
  code text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key,
  name text not null,
  avatar text not null default '💪',
  group_code text not null references groups(code) on delete cascade,
  body_weight numeric,
  created_at timestamptz not null default now()
);
create index if not exists profiles_group_idx on profiles(group_code);

create table if not exists workouts (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  group_code text not null references groups(code) on delete cascade,
  performed_at timestamptz not null,
  type text not null,
  duration_min integer not null check (duration_min between 0 and 240),
  calories integer not null check (calories between 0 and 2000),
  exercises jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists workouts_group_idx on workouts(group_code, performed_at);

create table if not exists reactions (
  workout_id uuid not null references workouts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  group_code text not null references groups(code) on delete cascade,
  primary key (workout_id, user_id, emoji)
);
create index if not exists reactions_group_idx on reactions(group_code);

-- Acesso: app entre amigos, sem login. Quem tem o código do grupo participa.
-- (Para algo mais fechado, troque por Supabase Auth + políticas por usuário.)
alter table groups enable row level security;
alter table profiles enable row level security;
alter table workouts enable row level security;
alter table reactions enable row level security;

drop policy if exists "anon all groups" on groups;
drop policy if exists "anon all profiles" on profiles;
drop policy if exists "anon all workouts" on workouts;
drop policy if exists "anon all reactions" on reactions;
create policy "anon all groups" on groups for all using (true) with check (true);
create policy "anon all profiles" on profiles for all using (true) with check (true);
create policy "anon all workouts" on workouts for all using (true) with check (true);
create policy "anon all reactions" on reactions for all using (true) with check (true);
