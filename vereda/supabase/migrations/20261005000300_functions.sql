-- =====================================================================
-- Vereda — operações atômicas de progresso e operações editoriais
-- As regras (XP, intervalos, datas locais) são calculadas no servidor
-- (src/lib/domain) e estas funções garantem atomicidade e idempotência.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Atividade diária (incrementos atômicos)
-- ---------------------------------------------------------------------
create or replace function public.bump_activity(
  p_user uuid, p_date date, p_lessons int, p_reviews int, p_minutes int, p_xp int
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.activity_days as a (user_id, local_date, lessons_completed, review_answers, minutes, xp)
  values (p_user, p_date, greatest(p_lessons, 0), greatest(p_reviews, 0), greatest(p_minutes, 0), greatest(p_xp, 0))
  on conflict (user_id, local_date) do update set
    lessons_completed = a.lessons_completed + greatest(p_lessons, 0),
    review_answers = a.review_answers + greatest(p_reviews, 0),
    minutes = a.minutes + greatest(p_minutes, 0),
    xp = a.xp + greatest(p_xp, 0),
    updated_at = now();
$$;

-- ---------------------------------------------------------------------
-- XP idempotente: a restrição única (user_id, source_type, source_key)
-- impede concessões duplicadas por clique duplo ou repetição de rede.
-- Retorna o XP efetivamente concedido (0 se já existia).
-- ---------------------------------------------------------------------
create or replace function public.award_xp(
  p_user uuid, p_type text, p_key text, p_amount int, p_date date
) returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_amount int;
begin
  if p_amount is null or p_amount <= 0 then
    return 0;
  end if;
  insert into public.xp_events (user_id, source_type, source_key, amount, local_date)
  values (p_user, p_type, p_key, p_amount, p_date)
  on conflict on constraint xp_events_idempotency do nothing
  returning amount into v_amount;
  return coalesce(v_amount, 0);
end;
$$;

-- XP limitado por dia: usa "vagas" numeradas; a restrição única garante o teto
-- mesmo com requisições concorrentes.
create or replace function public.award_capped_xp(
  p_user uuid, p_type text, p_prefix text, p_amount int, p_date date, p_slots int
) returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot int;
  v_got int;
begin
  for v_slot in 1 .. greatest(p_slots, 0) loop
    v_got := public.award_xp(p_user, p_type, p_prefix || ':' || p_date::text || ':' || v_slot, p_amount, p_date);
    if v_got > 0 then
      return v_got;
    end if;
  end loop;
  return 0;
end;
$$;

-- ---------------------------------------------------------------------
-- Respostas de lição: uma por exercício por tentativa.
-- Reenviar a mesma resposta (ou outra) não conta nova tentativa.
-- ---------------------------------------------------------------------
create or replace function public.record_attempt_answer(
  p_user uuid, p_attempt uuid, p_key text, p_answer jsonb, p_correct boolean
) returns table (inserted boolean, is_correct boolean, answer jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_row public.attempt_answers;
begin
  select a.status into v_status from public.lesson_attempts a
  where a.id = p_attempt and a.user_id = p_user
  for update;
  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;

  select * into v_row from public.attempt_answers aa
  where aa.attempt_id = p_attempt and aa.exercise_key = p_key;
  if found then
    return query select false, v_row.is_correct, v_row.answer;
    return;
  end if;

  if v_status <> 'in_progress' then
    raise exception 'attempt_closed' using errcode = 'P0001';
  end if;

  insert into public.attempt_answers (attempt_id, user_id, exercise_key, answer, is_correct)
  values (p_attempt, p_user, p_key, p_answer, p_correct);

  update public.lesson_attempts
    set answered_count = answered_count + 1,
        correct_count = correct_count + case when p_correct then 1 else 0 end,
        updated_at = now()
    where id = p_attempt;

  return query select true, p_correct, p_answer;
end;
$$;

-- Avança a etapa salva (nunca retrocede).
create or replace function public.save_attempt_step(p_user uuid, p_attempt uuid, p_step int)
returns int
language sql
security definer
set search_path = ''
as $$
  update public.lesson_attempts
    set current_step = greatest(current_step, least(p_step, 500)), updated_at = now()
    where id = p_attempt and user_id = p_user and status = 'in_progress'
  returning current_step;
$$;

-- ---------------------------------------------------------------------
-- Conclusão de lição: atômica e idempotente.
-- * Marca a tentativa como concluída apenas uma vez.
-- * Registra a conclusão (primeira vez + repetições).
-- * Libera a próxima etapa (para sempre).
-- * Concede XP apenas pela primeira conclusão (restrição única).
-- ---------------------------------------------------------------------
create or replace function public.finalize_lesson_attempt(
  p_user uuid,
  p_attempt uuid,
  p_local_date date,
  p_xp_type text,
  p_xp int,
  p_minutes int,
  p_track uuid,
  p_next_lesson uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.lesson_attempts;
  v_newly boolean := false;
  v_first boolean := false;
  v_xp int := 0;
begin
  select * into v_attempt from public.lesson_attempts
  where id = p_attempt and user_id = p_user
  for update;
  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;

  if v_attempt.status = 'in_progress' then
    update public.lesson_attempts
      set status = 'completed', completed_at = now(), updated_at = now()
      where id = p_attempt;
    v_newly := true;

    insert into public.lesson_completions as c
      (user_id, lesson_id, scope, best_correct, best_total)
    values (p_user, v_attempt.lesson_id, v_attempt.scope, v_attempt.correct_count, v_attempt.answered_count)
    on conflict (user_id, lesson_id, scope) do update set
      times_completed = c.times_completed + 1,
      last_completed_at = now(),
      best_correct = greatest(c.best_correct, excluded.best_correct),
      best_total = greatest(c.best_total, excluded.best_total)
    returning (c.times_completed = 1) into v_first;
  end if;

  if p_track is not null then
    insert into public.lesson_unlocks (user_id, track_id, lesson_id, scope)
    values (p_user, p_track, v_attempt.lesson_id, v_attempt.scope)
    on conflict do nothing;
    if p_next_lesson is not null then
      insert into public.lesson_unlocks (user_id, track_id, lesson_id, scope)
      values (p_user, p_track, p_next_lesson, v_attempt.scope)
      on conflict do nothing;
    end if;
  end if;

  if v_attempt.scope = 'live' then
    v_xp := public.award_xp(p_user, p_xp_type, v_attempt.lesson_id::text, p_xp, p_local_date);
    if v_newly then
      perform public.bump_activity(p_user, p_local_date, 1, 0, p_minutes, v_xp);
    elsif v_xp > 0 then
      perform public.bump_activity(p_user, p_local_date, 0, 0, 0, v_xp);
    end if;
  end if;

  return jsonb_build_object(
    'newly_completed', v_newly,
    'first_completion', v_first,
    'xp_awarded', v_xp,
    'lesson_id', v_attempt.lesson_id,
    'scope', v_attempt.scope
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Revisão espaçada
-- ---------------------------------------------------------------------
-- Erro em uma lição: cria o item (ou volta ao intervalo inicial) sem duplicar.
create or replace function public.schedule_review_mistake(
  p_user uuid, p_lesson uuid, p_key text, p_due date
) returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.review_items as r (user_id, lesson_id, exercise_key, origin, stage, due_on, times_wrong)
  values (p_user, p_lesson, p_key, 'mistake', 0, p_due, 1)
  on conflict on constraint review_items_unique do update set
    stage = 0,
    due_on = excluded.due_on,
    times_wrong = r.times_wrong + 1,
    origin = 'mistake',
    updated_at = now()
  returning id;
$$;

-- Resposta numa sessão de revisão. Idempotente por request_id.
-- p_stage_before protege contra respostas concorrentes desatualizadas.
create or replace function public.record_review_answer(
  p_user uuid,
  p_item uuid,
  p_request uuid,
  p_answer jsonb,
  p_correct boolean,
  p_stage_before smallint,
  p_stage_after smallint,
  p_due date,
  p_local_date date,
  p_xp int,
  p_xp_slots int,
  p_minutes int
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.review_events;
  v_item public.review_items;
  v_xp int := 0;
begin
  select * into v_event from public.review_events
  where user_id = p_user and request_id = p_request;
  if found then
    return jsonb_build_object('duplicate', true, 'is_correct', v_event.is_correct,
      'stage_after', v_event.stage_after, 'xp_awarded', 0);
  end if;

  select * into v_item from public.review_items
  where id = p_item and user_id = p_user
  for update;
  if not found then
    raise exception 'review_item_not_found' using errcode = 'P0002';
  end if;
  if v_item.stage <> p_stage_before then
    raise exception 'review_item_stale' using errcode = 'P0001';
  end if;

  update public.review_items set
    stage = p_stage_after,
    due_on = p_due,
    times_correct = times_correct + case when p_correct then 1 else 0 end,
    times_wrong = times_wrong + case when p_correct then 0 else 1 end,
    last_reviewed_at = now(),
    updated_at = now()
  where id = p_item;

  insert into public.review_events (user_id, review_item_id, request_id, answer, is_correct, stage_before, stage_after)
  values (p_user, p_item, p_request, p_answer, p_correct, p_stage_before, p_stage_after);

  if p_correct then
    v_xp := public.award_capped_xp(p_user, 'spaced_review', 'review', p_xp, p_local_date, p_xp_slots);
  end if;
  perform public.bump_activity(p_user, p_local_date, 0, 1, p_minutes, v_xp);

  return jsonb_build_object('duplicate', false, 'is_correct', p_correct,
    'stage_after', p_stage_after, 'xp_awarded', v_xp);
end;
$$;

-- Apenas o servidor (service_role) executa as funções de progresso.
revoke execute on function public.bump_activity(uuid, date, int, int, int, int) from public, anon, authenticated;
revoke execute on function public.award_xp(uuid, text, text, int, date) from public, anon, authenticated;
revoke execute on function public.award_capped_xp(uuid, text, text, int, date, int) from public, anon, authenticated;
revoke execute on function public.record_attempt_answer(uuid, uuid, text, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.save_attempt_step(uuid, uuid, int) from public, anon, authenticated;
revoke execute on function public.finalize_lesson_attempt(uuid, uuid, date, text, int, int, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.schedule_review_mistake(uuid, uuid, text, date) from public, anon, authenticated;
revoke execute on function public.record_review_answer(uuid, uuid, uuid, jsonb, boolean, smallint, smallint, date, date, int, int, int) from public, anon, authenticated;
grant execute on function public.bump_activity(uuid, date, int, int, int, int) to service_role;
grant execute on function public.award_xp(uuid, text, text, int, date) to service_role;
grant execute on function public.award_capped_xp(uuid, text, text, int, date, int) to service_role;
grant execute on function public.record_attempt_answer(uuid, uuid, text, jsonb, boolean) to service_role;
grant execute on function public.save_attempt_step(uuid, uuid, int) to service_role;
grant execute on function public.finalize_lesson_attempt(uuid, uuid, date, text, int, int, uuid, uuid) to service_role;
grant execute on function public.schedule_review_mistake(uuid, uuid, text, date) to service_role;
grant execute on function public.record_review_answer(uuid, uuid, uuid, jsonb, boolean, smallint, smallint, date, date, int, int, int) to service_role;

-- =====================================================================
-- Operações editoriais (executadas com o JWT de quem está logado).
-- Todas verificam a permissão no banco, não apenas na interface.
-- =====================================================================
create or replace function public.require_editor()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_editor() then
    raise exception 'Permissão editorial necessária.' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

create or replace function public.editorial_review_version(p_version uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
  v_status public.content_status;
begin
  select status into v_status from public.lesson_versions where id = p_version for update;
  if v_status is null then
    raise exception 'Versão não encontrada.';
  end if;
  if v_status <> 'draft' then
    raise exception 'Somente rascunhos podem ser marcados como revisados.';
  end if;
  update public.lesson_versions
    set status = 'reviewed', reviewed_by = v_actor, reviewed_at = now()
    where id = p_version;
  insert into public.editorial_log (entity_type, entity_id, action, actor_id)
  values ('lesson_version', p_version, 'reviewed', v_actor);
end;
$$;

create or replace function public.editorial_reset_version(p_version uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
begin
  update public.lesson_versions
    set status = 'draft', reviewed_by = null, reviewed_at = null
    where id = p_version and status = 'reviewed';
  if found then
    insert into public.editorial_log (entity_type, entity_id, action, actor_id)
    values ('lesson_version', p_version, 'reset_to_draft', v_actor);
  end if;
end;
$$;

create or replace function public.editorial_publish_version(p_version uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
  v_row public.lesson_versions;
  v_count int;
begin
  select * into v_row from public.lesson_versions where id = p_version for update;
  if not found then
    raise exception 'Versão não encontrada.';
  end if;
  if v_row.status <> 'reviewed' then
    raise exception 'Somente versões revisadas podem ser publicadas.';
  end if;
  select count(*) into v_count from public.exercises where lesson_version_id = p_version;
  if v_count = 0 then
    raise exception 'Uma lição publicada precisa ter exercícios.';
  end if;
  update public.lesson_versions
    set status = 'archived', archived_at = now()
    where lesson_id = v_row.lesson_id and status = 'published';
  update public.lesson_versions
    set status = 'published', published_by = v_actor, published_at = now()
    where id = p_version;
  insert into public.editorial_log (entity_type, entity_id, action, actor_id)
  values ('lesson_version', p_version, 'published', v_actor);
end;
$$;

create or replace function public.editorial_unpublish_lesson(p_lesson uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
  v_version uuid;
begin
  update public.lesson_versions
    set status = 'archived', archived_at = now()
    where lesson_id = p_lesson and status = 'published'
    returning id into v_version;
  if v_version is not null then
    insert into public.editorial_log (entity_type, entity_id, action, actor_id)
    values ('lesson_version', v_version, 'unpublished', v_actor);
  end if;
end;
$$;

-- Cria (ou retorna) a versão de trabalho a partir da versão mais recente,
-- sem tocar na versão pública.
create or replace function public.editorial_working_version(p_lesson uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
  v_existing uuid;
  v_source public.lesson_versions;
  v_new uuid;
  v_ex record;
  v_new_ex uuid;
begin
  perform 1 from public.lessons where id = p_lesson for update;
  select id into v_existing from public.lesson_versions
    where lesson_id = p_lesson and status in ('draft', 'reviewed');
  if v_existing is not null then
    return v_existing;
  end if;

  select * into v_source from public.lesson_versions
    where lesson_id = p_lesson
    order by (status = 'published') desc, version desc
    limit 1;
  if not found then
    raise exception 'Lição sem versões.';
  end if;

  insert into public.lesson_versions (lesson_id, version, status, title, objective, content,
    ai_generated, seed_hash, edited_in_admin, created_by, updated_by)
  values (p_lesson,
    (select max(version) + 1 from public.lesson_versions where lesson_id = p_lesson),
    'draft', v_source.title, v_source.objective, v_source.content,
    v_source.ai_generated, v_source.seed_hash, true, v_actor, v_actor)
  returning id into v_new;

  for v_ex in
    select e.*, s.solution, s.explanation from public.exercises e
    left join public.exercise_solutions s on s.exercise_id = e.id
    where e.lesson_version_id = v_source.id order by e.position
  loop
    insert into public.exercises (lesson_version_id, key, position, type, prompt, data, reference)
    values (v_new, v_ex.key, v_ex.position, v_ex.type, v_ex.prompt, v_ex.data, v_ex.reference)
    returning id into v_new_ex;
    if v_ex.solution is not null then
      insert into public.exercise_solutions (exercise_id, solution, explanation)
      values (v_new_ex, v_ex.solution, v_ex.explanation);
    end if;
  end loop;

  insert into public.editorial_log (entity_type, entity_id, action, actor_id)
  values ('lesson_version', v_new, 'created_version', v_actor);
  return v_new;
end;
$$;

-- Personagens, trilhas e unidades: editar, revisar, publicar.
create or replace function public.editorial_entity_table(p_type text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'character' then 'characters'
    when 'track' then 'tracks'
    when 'unit' then 'units'
  end;
$$;

-- Salva alterações. Se o registro já está publicado, as alterações ficam em
-- `pending` até a próxima publicação, sem afetar a versão pública.
create or replace function public.editorial_save_entity(p_type text, p_id uuid, p_changes jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
  v_table text := public.editorial_entity_table(p_type);
  v_allowed text[];
  v_clean jsonb := '{}'::jsonb;
  v_key text;
  v_status public.content_status;
  v_set text := '';
begin
  if v_table is null then
    raise exception 'Tipo inválido.';
  end if;
  v_allowed := case p_type
    when 'character' then array['name', 'title', 'tagline', 'description', 'color', 'scene']
    when 'track' then array['title', 'subtitle', 'description', 'color', 'scene']
    when 'unit' then array['title', 'description', 'scene']
  end;
  for v_key in select jsonb_object_keys(p_changes) loop
    if v_key = any (v_allowed) and jsonb_typeof(p_changes -> v_key) = 'string' then
      v_clean := v_clean || jsonb_build_object(v_key, left(p_changes ->> v_key, 2000));
    end if;
  end loop;
  if v_clean = '{}'::jsonb then
    return;
  end if;

  execute format('select status from public.%I where id = $1 for update', v_table) into v_status using p_id;
  if v_status is null then
    raise exception 'Registro não encontrado.';
  end if;

  if v_status = 'published' then
    execute format('update public.%I set pending = coalesce(pending, ''{}''::jsonb) || $1, updated_by = $2 where id = $3', v_table)
      using v_clean, v_actor, p_id;
  else
    for v_key in select jsonb_object_keys(v_clean) loop
      v_set := v_set || format('%I = %L, ', v_key, v_clean ->> v_key);
    end loop;
    execute format('update public.%I set %s status = ''draft'', reviewed_by = null, reviewed_at = null, updated_by = $1 where id = $2', v_table, v_set)
      using v_actor, p_id;
  end if;
  insert into public.editorial_log (entity_type, entity_id, action, actor_id, note)
  values (p_type, p_id, 'edited', v_actor, v_clean::text);
end;
$$;

-- p_action: 'review' (rascunho → revisado), 'publish' (revisado → publicado,
-- ou publica alterações pendentes), 'unpublish' (publicado → rascunho).
create or replace function public.editorial_entity_status(p_type text, p_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
  v_table text := public.editorial_entity_table(p_type);
  v_status public.content_status;
  v_pending jsonb;
  v_set text := '';
  v_key text;
begin
  if v_table is null then
    raise exception 'Tipo inválido.';
  end if;
  execute format('select status, pending from public.%I where id = $1 for update', v_table)
    into v_status, v_pending using p_id;
  if v_status is null then
    raise exception 'Registro não encontrado.';
  end if;

  if p_action = 'review' then
    if v_status <> 'draft' then
      raise exception 'Somente rascunhos podem ser revisados.';
    end if;
    execute format('update public.%I set status = ''reviewed'', reviewed_by = $1, reviewed_at = now() where id = $2', v_table)
      using v_actor, p_id;
    insert into public.editorial_log (entity_type, entity_id, action, actor_id) values (p_type, p_id, 'reviewed', v_actor);
  elsif p_action = 'publish' then
    if v_status = 'reviewed' then
      execute format('update public.%I set status = ''published'', published_by = $1, published_at = now() where id = $2', v_table)
        using v_actor, p_id;
    elsif v_status = 'published' and v_pending is not null then
      -- Publicar alterações pendentes equivale a revisá-las e publicá-las.
      for v_key in select jsonb_object_keys(v_pending) loop
        v_set := v_set || format('%I = %L, ', v_key, v_pending ->> v_key);
      end loop;
      execute format('update public.%I set %s pending = null, reviewed_by = $1, reviewed_at = now(), published_by = $1, published_at = now() where id = $2', v_table, v_set)
        using v_actor, p_id;
      insert into public.editorial_log (entity_type, entity_id, action, actor_id) values (p_type, p_id, 'reviewed', v_actor);
    else
      raise exception 'Revise antes de publicar.';
    end if;
    insert into public.editorial_log (entity_type, entity_id, action, actor_id) values (p_type, p_id, 'published', v_actor);
  elsif p_action = 'unpublish' then
    execute format('update public.%I set status = ''draft'', reviewed_by = null, reviewed_at = null where id = $1 and status = ''published''', v_table)
      using p_id;
    insert into public.editorial_log (entity_type, entity_id, action, actor_id) values (p_type, p_id, 'unpublished', v_actor);
  elsif p_action = 'discard_pending' then
    execute format('update public.%I set pending = null where id = $1', v_table) using p_id;
  else
    raise exception 'Ação inválida.';
  end if;
end;
$$;

-- Revisão/publicação em lote de uma unidade ou trilha inteira.
-- Exige a confirmação explícita de quem revisou (feita na interface).
create or replace function public.editorial_bulk(p_scope text, p_id uuid, p_action text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
  v_units uuid[];
  v_track uuid;
  v_character uuid;
  v_version record;
  v_count int := 0;
begin
  if p_scope = 'unit' then
    v_units := array[p_id];
    select track_id into v_track from public.units where id = p_id;
  elsif p_scope = 'track' then
    select array_agg(id) into v_units from public.units where track_id = p_id;
    v_track := p_id;
  else
    raise exception 'Escopo inválido.';
  end if;
  if v_track is null then
    raise exception 'Registro não encontrado.';
  end if;
  select character_id into v_character from public.tracks where id = v_track;

  for v_version in
    select distinct v.id, v.status from public.lesson_versions v
    join public.unit_items ui on ui.lesson_id = v.lesson_id
    where ui.unit_id = any (coalesce(v_units, '{}'))
      and v.status in ('draft', 'reviewed')
  loop
    if p_action = 'review' and v_version.status = 'draft' then
      perform public.editorial_review_version(v_version.id);
      v_count := v_count + 1;
    elsif p_action = 'publish' and v_version.status = 'reviewed' then
      perform public.editorial_publish_version(v_version.id);
      v_count := v_count + 1;
    end if;
  end loop;

  if p_action = 'review' then
    update public.units set status = 'reviewed', reviewed_by = v_actor, reviewed_at = now()
      where id = any (coalesce(v_units, '{}')) and status = 'draft';
    if p_scope = 'track' then
      update public.tracks set status = 'reviewed', reviewed_by = v_actor, reviewed_at = now()
        where id = v_track and status = 'draft';
      if v_character is not null then
        update public.characters set status = 'reviewed', reviewed_by = v_actor, reviewed_at = now()
          where id = v_character and status = 'draft';
      end if;
    end if;
  elsif p_action = 'publish' then
    update public.units set status = 'published', published_by = v_actor, published_at = now()
      where id = any (coalesce(v_units, '{}')) and status = 'reviewed';
    if p_scope = 'track' then
      update public.tracks set status = 'published', published_by = v_actor, published_at = now()
        where id = v_track and status = 'reviewed';
      if v_character is not null then
        update public.characters set status = 'published', published_by = v_actor, published_at = now()
          where id = v_character and status = 'reviewed';
      end if;
    end if;
  else
    raise exception 'Ação inválida.';
  end if;

  insert into public.editorial_log (entity_type, entity_id, action, actor_id, note)
  values (case when p_scope = 'unit' then 'unit' else 'track' end, p_id,
    case when p_action = 'review' then 'reviewed' else 'published' end, v_actor, 'lote: ' || v_count || ' versões');
  return v_count;
end;
$$;

-- Reordenação (troca com o vizinho) dentro de uma transação.
create or replace function public.editorial_move(p_type text, p_id uuid, p_direction int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := public.require_editor();
  v_parent uuid;
  v_pos int;
  v_other uuid;
  v_other_pos int;
begin
  set constraints all deferred;
  if p_type = 'unit' then
    select track_id, sort_order into v_parent, v_pos from public.units where id = p_id;
    select id, sort_order into v_other, v_other_pos from public.units
      where track_id = v_parent
        and (case when p_direction < 0 then sort_order < v_pos else sort_order > v_pos end)
      order by case when p_direction < 0 then -sort_order else sort_order end
      limit 1;
    if v_other is null then return; end if;
    update public.units set sort_order = v_other_pos where id = p_id;
    update public.units set sort_order = v_pos where id = v_other;
  elsif p_type = 'item' then
    select unit_id, position into v_parent, v_pos from public.unit_items where id = p_id;
    select id, position into v_other, v_other_pos from public.unit_items
      where unit_id = v_parent
        and (case when p_direction < 0 then position < v_pos else position > v_pos end)
      order by case when p_direction < 0 then -position else position end
      limit 1;
    if v_other is null then return; end if;
    update public.unit_items set position = v_other_pos where id = p_id;
    update public.unit_items set position = v_pos where id = v_other;
  else
    raise exception 'Tipo inválido.';
  end if;
  insert into public.editorial_log (entity_type, entity_id, action, actor_id)
  values (case when p_type = 'unit' then 'unit' else 'unit' end, coalesce(v_parent, p_id), 'reordered', v_actor);
end;
$$;

grant execute on function public.require_editor() to authenticated;
grant execute on function public.editorial_review_version(uuid) to authenticated;
grant execute on function public.editorial_reset_version(uuid) to authenticated;
grant execute on function public.editorial_publish_version(uuid) to authenticated;
grant execute on function public.editorial_unpublish_lesson(uuid) to authenticated;
grant execute on function public.editorial_working_version(uuid) to authenticated;
grant execute on function public.editorial_save_entity(text, uuid, jsonb) to authenticated;
grant execute on function public.editorial_entity_status(text, uuid, text) to authenticated;
grant execute on function public.editorial_bulk(text, uuid, text) to authenticated;
grant execute on function public.editorial_move(text, uuid, int) to authenticated;

-- =====================================================================
-- Administração de papéis
-- O primeiro administrador é definido por quem controla o banco
-- (SQL Editor do Supabase ou script com service role). Depois disso, somente
-- administradores concedem papéis. Ninguém se promove pela aplicação.
-- =====================================================================
create or replace function public.admin_grant_role(p_email text, p_role public.app_role)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
  v_claim_role text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  v_privileged boolean;
begin
  v_privileged := v_claim_role = 'service_role'
    or (auth.uid() is null and v_claim_role is null and session_user in ('postgres', 'supabase_admin'));
  if not v_privileged and not public.is_admin() then
    raise exception 'Somente administradores podem conceder papéis.' using errcode = '42501';
  end if;
  select id into v_target from auth.users where lower(email) = lower(trim(p_email));
  if v_target is null then
    raise exception 'Nenhuma conta encontrada com esse e-mail.';
  end if;
  insert into public.user_roles (user_id, role, granted_by)
  values (v_target, p_role, auth.uid())
  on conflict do nothing;
  return v_target;
end;
$$;

create or replace function public.admin_revoke_role(p_user uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem remover papéis.' using errcode = '42501';
  end if;
  if p_user = auth.uid() and p_role = 'admin' then
    raise exception 'Você não pode remover seu próprio acesso de administrador.';
  end if;
  delete from public.user_roles where user_id = p_user and role = p_role;
end;
$$;

grant execute on function public.admin_grant_role(text, public.app_role) to authenticated, service_role;
grant execute on function public.admin_revoke_role(uuid, public.app_role) to authenticated;

-- Lista da equipe editorial (somente administradores).
create or replace function public.admin_list_team()
returns table (user_id uuid, email text, display_name text, roles public.app_role[])
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Somente administradores.' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, p.display_name, array_agg(r.role order by r.role)
    from public.user_roles r
    join auth.users u on u.id = r.user_id
    left join public.profiles p on p.id = u.id
    group by u.id, u.email, p.display_name
    order by u.email;
end;
$$;
grant execute on function public.admin_list_team() to authenticated;
