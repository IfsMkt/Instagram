-- =====================================================================
-- Vereda — esquema principal
-- Conteúdo editorial, progresso, gamificação, revisão espaçada, caderno
-- e permissões administrativas.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.content_status as enum ('draft', 'reviewed', 'published', 'archived');
create type public.track_kind as enum ('general', 'character');
create type public.lesson_kind as enum ('lesson', 'unit_review');
create type public.exercise_type as enum ('multiple_choice', 'true_false', 'matching', 'ordering', 'fill_blank');
create type public.progress_scope as enum ('live', 'preview');
create type public.app_role as enum ('admin', 'editor');

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Papéis administrativos
-- Nenhuma política de escrita para usuários: ninguém promove a si mesmo.
-- ---------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(p_user uuid, p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = p_user and r.role = any (p_roles)
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(auth.uid(), array['admin', 'editor']::public.app_role[]);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(auth.uid(), array['admin']::public.app_role[]);
$$;

-- ---------------------------------------------------------------------
-- Conteúdo: personagens, trilhas, unidades
-- `pending` guarda alterações de trabalho sobre um registro já publicado;
-- elas só entram no ar ao publicar novamente.
-- ---------------------------------------------------------------------
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  title text not null,
  tagline text not null default '',
  description text not null default '',
  color text not null default 'green',
  scene text not null default 'garden',
  sort_order int not null default 0,
  status public.content_status not null default 'draft' check (status <> 'archived'),
  pending jsonb,
  ai_generated boolean not null default false,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  kind public.track_kind not null,
  character_id uuid unique references public.characters (id) on delete restrict,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  color text not null default 'green',
  scene text not null default 'garden',
  sort_order int not null default 0,
  status public.content_status not null default 'draft' check (status <> 'archived'),
  pending jsonb,
  ai_generated boolean not null default false,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'character') = (character_id is not null))
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text not null default '',
  scene text not null default 'garden',
  sort_order int not null,
  status public.content_status not null default 'draft' check (status <> 'archived'),
  pending jsonb,
  ai_generated boolean not null default false,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint units_track_order_key unique (track_id, sort_order) deferrable initially immediate
);
create index units_track_idx on public.units (track_id, sort_order);

-- ---------------------------------------------------------------------
-- Lições (identidade estável) e posições nas unidades.
-- Uma lição pode aparecer em mais de uma trilha (conteúdo compartilhado).
-- ---------------------------------------------------------------------
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  kind public.lesson_kind not null default 'lesson',
  created_at timestamptz not null default now()
);

create table public.unit_items (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete restrict,
  position int not null,
  created_at timestamptz not null default now(),
  constraint unit_items_unit_lesson_key unique (unit_id, lesson_id),
  constraint unit_items_unit_position_key unique (unit_id, position) deferrable initially immediate
);
create index unit_items_lesson_idx on public.unit_items (lesson_id);

-- ---------------------------------------------------------------------
-- Versões editoriais das lições.
-- No máximo uma versão publicada e uma versão de trabalho por lição.
-- ---------------------------------------------------------------------
create table public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  version int not null,
  status public.content_status not null default 'draft',
  title text not null,
  objective text not null default '',
  content jsonb not null default '{}'::jsonb,
  ai_generated boolean not null default false,
  seed_hash text,
  edited_in_admin boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  archived_at timestamptz,
  unique (lesson_id, version),
  check (status in ('draft') or reviewed_at is not null)
);
create unique index lesson_versions_one_published
  on public.lesson_versions (lesson_id) where status = 'published';
create unique index lesson_versions_one_working
  on public.lesson_versions (lesson_id) where status in ('draft', 'reviewed');

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_version_id uuid not null references public.lesson_versions (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9:-]+$'),
  position int not null,
  type public.exercise_type not null,
  prompt text not null,
  data jsonb not null default '{}'::jsonb,
  reference text not null default '',
  constraint exercises_version_key unique (lesson_version_id, key),
  constraint exercises_version_position_key unique (lesson_version_id, position) deferrable initially immediate
);

-- Gabaritos: nunca expostos ao público. Somente editores e o servidor.
create table public.exercise_solutions (
  exercise_id uuid primary key references public.exercises (id) on delete cascade,
  solution jsonb not null,
  explanation text not null default ''
);

-- Histórico editorial: quem revisou, publicou, criou versões.
create table public.editorial_log (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('character', 'track', 'unit', 'lesson_version')),
  entity_id uuid not null,
  action text not null check (action in ('created_version', 'edited', 'reviewed', 'published', 'unpublished', 'reordered', 'reset_to_draft')),
  actor_id uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index editorial_log_entity_idx on public.editorial_log (entity_type, entity_id, created_at desc);

-- Alterar uma versão revisada volta a deixá-la como rascunho.
create or replace function public.lesson_version_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('published', 'archived')
     and (new.title is distinct from old.title
          or new.objective is distinct from old.objective
          or new.content is distinct from old.content) then
    raise exception 'Versões publicadas ou arquivadas não podem ser editadas; crie uma versão de trabalho.';
  end if;
  if old.status = 'reviewed' and new.status = 'reviewed'
     and (new.title is distinct from old.title
          or new.objective is distinct from old.objective
          or new.content is distinct from old.content) then
    new.status := 'draft';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger lesson_versions_guard before update on public.lesson_versions
  for each row execute function public.lesson_version_guard();

-- Exercícios de versões publicadas/arquivadas são imutáveis.
create or replace function public.exercise_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status public.content_status;
  v_version uuid;
begin
  if tg_table_name = 'exercise_solutions' then
    select e.lesson_version_id into v_version from public.exercises e
    where e.id = coalesce(new.exercise_id, old.exercise_id);
  else
    v_version := coalesce(new.lesson_version_id, old.lesson_version_id);
  end if;
  select status into v_status from public.lesson_versions where id = v_version;
  if v_status in ('published', 'archived') then
    raise exception 'Exercícios de versões publicadas não podem ser alterados; crie uma versão de trabalho.';
  end if;
  if v_status = 'reviewed' then
    update public.lesson_versions
      set status = 'draft', reviewed_by = null, reviewed_at = null
      where id = v_version;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger exercises_guard before insert or update or delete on public.exercises
  for each row execute function public.exercise_guard();
create trigger exercise_solutions_guard before insert or update or delete on public.exercise_solutions
  for each row execute function public.exercise_guard();

create trigger characters_touch before update on public.characters for each row execute function public.touch_updated_at();
create trigger tracks_touch before update on public.tracks for each row execute function public.touch_updated_at();
create trigger units_touch before update on public.units for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Perfil e preferências
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  avatar text not null default 'ovelha' check (avatar ~ '^[a-z0-9-]+$'),
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) between 1 and 64),
  daily_goal_minutes smallint not null default 5 check (daily_goal_minutes in (5, 10, 15)),
  bible_knowledge text check (bible_knowledge in ('nenhum', 'pouco', 'algum', 'bastante')),
  learning_goal text check (learning_goal in ('conhecer', 'rotina', 'aprofundar', 'ensinar', 'curiosidade')),
  tradition text check (tradition in ('geral', 'catolica', 'protestante', 'prefiro-nao-dizer')),
  onboarding_step smallint not null default 0 check (onboarding_step between 0 and 20),
  onboarding_completed_at timestamptz,
  active_track_id uuid references public.tracks (id) on delete set null,
  sound_enabled boolean not null default false,
  reduced_motion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), ''), 60))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Progresso. `scope = 'preview'` é o progresso de teste da prévia editorial,
-- totalmente separado do progresso real ('live').
-- ---------------------------------------------------------------------
create table public.track_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  scope public.progress_scope not null default 'live',
  started_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  primary key (user_id, track_id, scope)
);

-- Desbloqueios explícitos: uma etapa liberada nunca volta a ficar bloqueada.
create table public.lesson_unlocks (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  scope public.progress_scope not null default 'live',
  unlocked_at timestamptz not null default now(),
  primary key (user_id, track_id, lesson_id, scope)
);

create table public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  lesson_version_id uuid not null references public.lesson_versions (id) on delete cascade,
  track_id uuid references public.tracks (id) on delete set null,
  scope public.progress_scope not null default 'live',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  current_step int not null default 0 check (current_step >= 0),
  correct_count int not null default 0,
  answered_count int not null default 0,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status = 'completed') = (completed_at is not null))
);
create unique index lesson_attempts_one_open
  on public.lesson_attempts (user_id, lesson_id, scope) where status = 'in_progress';
create index lesson_attempts_user_idx on public.lesson_attempts (user_id, scope, updated_at desc);

create table public.attempt_answers (
  attempt_id uuid not null references public.lesson_attempts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_key text not null,
  answer jsonb not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, exercise_key)
);
create index attempt_answers_user_idx on public.attempt_answers (user_id);

create table public.lesson_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  scope public.progress_scope not null default 'live',
  first_completed_at timestamptz not null default now(),
  last_completed_at timestamptz not null default now(),
  times_completed int not null default 1 check (times_completed >= 1),
  best_correct int not null default 0,
  best_total int not null default 0,
  primary key (user_id, lesson_id, scope)
);

-- ---------------------------------------------------------------------
-- Gamificação
-- ---------------------------------------------------------------------
create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null check (source_type in ('lesson', 'unit_review', 'spaced_review')),
  source_key text not null,
  amount int not null check (amount > 0 and amount <= 100),
  local_date date not null,
  created_at timestamptz not null default now(),
  constraint xp_events_idempotency unique (user_id, source_type, source_key)
);
create index xp_events_user_date_idx on public.xp_events (user_id, local_date);

create table public.activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  lessons_completed int not null default 0 check (lessons_completed >= 0),
  review_answers int not null default 0 check (review_answers >= 0),
  minutes int not null default 0 check (minutes >= 0),
  xp int not null default 0 check (xp >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

create table public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null check (achievement_id ~ '^[a-z0-9-]+$'),
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------
-- Revisão espaçada (1, 3, 7, 14 dias). Um item por usuário + exercício.
-- stage: 0 → próxima em 1 dia; 1 → 3 dias; 2 → 7 dias; 3 → 14 dias; 4 → dominado.
-- ---------------------------------------------------------------------
create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  exercise_key text not null,
  origin text not null default 'mistake' check (origin in ('mistake', 'scheduled')),
  stage smallint not null default 0 check (stage between 0 and 4),
  due_on date,
  times_correct int not null default 0,
  times_wrong int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_items_unique unique (user_id, lesson_id, exercise_key),
  check ((stage = 4) = (due_on is null))
);
create index review_items_due_idx on public.review_items (user_id, due_on) where due_on is not null;

create table public.review_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  review_item_id uuid not null references public.review_items (id) on delete cascade,
  request_id uuid not null,
  answer jsonb not null,
  is_correct boolean not null,
  stage_before smallint not null,
  stage_after smallint not null,
  answered_at timestamptz not null default now(),
  constraint review_events_request_unique unique (user_id, request_id)
);
create index review_events_item_idx on public.review_events (review_item_id, answered_at desc);

-- ---------------------------------------------------------------------
-- Caderno privado
-- ---------------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  reference text not null check (char_length(reference) between 2 and 80),
  note text not null default '' check (char_length(note) <= 500),
  lesson_id uuid references public.lessons (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, reference)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind text not null default 'note' check (kind in ('note', 'reflection')),
  title text not null default '' check (char_length(title) <= 120),
  body text not null check (char_length(body) between 1 and 5000),
  reference text not null default '' check (char_length(reference) <= 80),
  lesson_id uuid references public.lessons (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_idx on public.notes (user_id, updated_at desc);
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();
