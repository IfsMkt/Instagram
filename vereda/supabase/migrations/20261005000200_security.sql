-- =====================================================================
-- Vereda — Row Level Security, privilégios e visibilidade de conteúdo
-- =====================================================================

-- Visibilidade pública: só conteúdo publicado e cuja hierarquia está publicada.
create or replace function public.track_is_public(p_track uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tracks t
    left join public.characters c on c.id = t.character_id
    where t.id = p_track
      and t.status = 'published'
      and (t.character_id is null or c.status = 'published')
  );
$$;

create or replace function public.unit_is_public(p_unit uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.units u
    where u.id = p_unit and u.status = 'published' and public.track_is_public(u.track_id)
  );
$$;

create or replace function public.lesson_is_public(p_lesson uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.unit_items ui
    where ui.lesson_id = p_lesson and public.unit_is_public(ui.unit_id)
  )
  and exists (
    select 1 from public.lesson_versions v
    where v.lesson_id = p_lesson and v.status = 'published'
  );
$$;

-- ---------------------------------------------------------------------
-- Ativa RLS em todas as tabelas do esquema público.
-- ---------------------------------------------------------------------
alter table public.user_roles enable row level security;
alter table public.characters enable row level security;
alter table public.tracks enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.unit_items enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_solutions enable row level security;
alter table public.editorial_log enable row level security;
alter table public.profiles enable row level security;
alter table public.track_progress enable row level security;
alter table public.lesson_unlocks enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.xp_events enable row level security;
alter table public.activity_days enable row level security;
alter table public.user_achievements enable row level security;
alter table public.review_items enable row level security;
alter table public.review_events enable row level security;
alter table public.favorites enable row level security;
alter table public.notes enable row level security;

-- Privilégios de base: removemos tudo e concedemos apenas o necessário.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Funções auxiliares usadas pelas políticas.
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.track_is_public(uuid) to anon, authenticated;
grant execute on function public.unit_is_public(uuid) to anon, authenticated;
grant execute on function public.lesson_is_public(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Papéis
-- ---------------------------------------------------------------------
grant select on public.user_roles to authenticated;
create policy "ver os próprios papéis" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- Conteúdo: leitura pública do que está publicado; editores veem tudo.
-- Escrita somente por editores.
-- ---------------------------------------------------------------------
grant select on public.characters, public.tracks, public.units, public.lessons,
  public.unit_items, public.lesson_versions, public.exercises to anon, authenticated;
grant insert, update on public.characters, public.tracks, public.units, public.lessons,
  public.unit_items, public.lesson_versions, public.exercises, public.exercise_solutions to authenticated;
grant delete on public.unit_items, public.exercises, public.exercise_solutions to authenticated;
grant select on public.exercise_solutions, public.editorial_log to authenticated;

create policy "personagens publicados" on public.characters
  for select to anon, authenticated using (status = 'published' or public.is_editor());
create policy "editores alteram personagens" on public.characters
  for insert to authenticated with check (public.is_editor());
create policy "editores atualizam personagens" on public.characters
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "trilhas publicadas" on public.tracks
  for select to anon, authenticated using (public.track_is_public(id) or public.is_editor());
create policy "editores criam trilhas" on public.tracks
  for insert to authenticated with check (public.is_editor());
create policy "editores atualizam trilhas" on public.tracks
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "unidades publicadas" on public.units
  for select to anon, authenticated using (public.unit_is_public(id) or public.is_editor());
create policy "editores criam unidades" on public.units
  for insert to authenticated with check (public.is_editor());
create policy "editores atualizam unidades" on public.units
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "lições publicadas" on public.lessons
  for select to anon, authenticated using (public.lesson_is_public(id) or public.is_editor());
create policy "editores criam lições" on public.lessons
  for insert to authenticated with check (public.is_editor());
create policy "editores atualizam lições" on public.lessons
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "posições publicadas" on public.unit_items
  for select to anon, authenticated using (
    (public.unit_is_public(unit_id) and public.lesson_is_public(lesson_id)) or public.is_editor()
  );
create policy "editores criam posições" on public.unit_items
  for insert to authenticated with check (public.is_editor());
create policy "editores atualizam posições" on public.unit_items
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "editores removem posições" on public.unit_items
  for delete to authenticated using (public.is_editor());

create policy "versões publicadas" on public.lesson_versions
  for select to anon, authenticated using (
    (status = 'published' and public.lesson_is_public(lesson_id)) or public.is_editor()
  );
create policy "editores criam versões" on public.lesson_versions
  for insert to authenticated with check (public.is_editor() and status = 'draft');
-- Revisão e publicação acontecem apenas pelas funções dedicadas (abaixo).
create policy "editores editam versões de trabalho" on public.lesson_versions
  for update to authenticated
  using (public.is_editor() and status in ('draft', 'reviewed'))
  with check (public.is_editor() and status = 'draft');

create policy "exercícios publicados" on public.exercises
  for select to anon, authenticated using (
    public.is_editor() or exists (
      select 1 from public.lesson_versions v
      where v.id = lesson_version_id and v.status = 'published' and public.lesson_is_public(v.lesson_id)
    )
  );
create policy "editores criam exercícios" on public.exercises
  for insert to authenticated with check (public.is_editor());
create policy "editores atualizam exercícios" on public.exercises
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "editores removem exercícios" on public.exercises
  for delete to authenticated using (public.is_editor());

create policy "gabaritos só para editores" on public.exercise_solutions
  for select to authenticated using (public.is_editor());
create policy "editores criam gabaritos" on public.exercise_solutions
  for insert to authenticated with check (public.is_editor());
create policy "editores atualizam gabaritos" on public.exercise_solutions
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "editores removem gabaritos" on public.exercise_solutions
  for delete to authenticated using (public.is_editor());

create policy "editores leem histórico" on public.editorial_log
  for select to authenticated using (public.is_editor());

-- ---------------------------------------------------------------------
-- Perfil: cada pessoa lê e edita apenas o próprio perfil e apenas colunas
-- de preferência. Não há coluna de papel no perfil.
-- ---------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (display_name, avatar, timezone, daily_goal_minutes, bible_knowledge, learning_goal,
  tradition, onboarding_step, onboarding_completed_at, active_track_id, sound_enabled, reduced_motion)
  on public.profiles to authenticated;
create policy "ver o próprio perfil" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "editar o próprio perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- Progresso e gamificação: leitura apenas do dono. Escritas acontecem no
-- servidor, que valida respostas antes de registrar.
-- ---------------------------------------------------------------------
grant select on public.track_progress, public.lesson_unlocks, public.lesson_attempts,
  public.attempt_answers, public.lesson_completions, public.xp_events, public.activity_days,
  public.user_achievements, public.review_items, public.review_events to authenticated;

create policy "dono lê" on public.track_progress for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.lesson_unlocks for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.lesson_attempts for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.attempt_answers for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.lesson_completions for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.xp_events for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.activity_days for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.user_achievements for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.review_items for select to authenticated using (user_id = auth.uid());
create policy "dono lê" on public.review_events for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Caderno: CRUD somente do dono.
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.favorites, public.notes to authenticated;

create policy "dono lê favoritos" on public.favorites for select to authenticated using (user_id = auth.uid());
create policy "dono cria favoritos" on public.favorites for insert to authenticated with check (user_id = auth.uid());
create policy "dono altera favoritos" on public.favorites for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dono remove favoritos" on public.favorites for delete to authenticated using (user_id = auth.uid());

create policy "dono lê anotações" on public.notes for select to authenticated using (user_id = auth.uid());
create policy "dono cria anotações" on public.notes for insert to authenticated with check (user_id = auth.uid());
create policy "dono altera anotações" on public.notes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dono remove anotações" on public.notes for delete to authenticated using (user_id = auth.uid());
