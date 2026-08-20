-- ============================================================================
-- "Could You Pass Your Kid's Class?" — usage analytics schema
--
-- Run this once in the Supabase SQL Editor for this project:
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run
--
-- The game (game.js) posts events here using ONLY the public "publishable"
-- key — never the service_role key or DB password. The RLS policy below is
-- what makes that safe: the anon role can INSERT and nothing else, so a
-- leaked publishable key can never be used to read or tamper with data.
-- ============================================================================

create table if not exists public.game_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  event_type text not null check (
    event_type in ('session_start', 'question_answered', 'session_complete', 'session_closed')
  ),
  screen text,
  payload jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists game_events_session_id_idx on public.game_events (session_id);
create index if not exists game_events_type_created_idx on public.game_events (event_type, created_at);

alter table public.game_events enable row level security;

drop policy if exists "anon can insert game events" on public.game_events;
create policy "anon can insert game events"
  on public.game_events
  for insert
  to anon
  with check (true);
-- Deliberately no SELECT / UPDATE / DELETE policy for anon — the table is
-- write-only from the browser. Read it from the Supabase dashboard (which
-- uses your logged-in/service role) or via the view below.

-- ----------------------------------------------------------------------------
-- session_summary — one row per playthrough, reconstructed from the events
-- above, with one column per question. Convenient for browsing in Table
-- Editor; not exposed to anon. Dropped and recreated (not CREATE OR REPLACE)
-- because Postgres refuses to rename/remove view columns in place.
-- ----------------------------------------------------------------------------
drop view if exists public.session_summary;

create view public.session_summary as
select
  started.session_id,
  started.started_at,
  started.user_agent,
  started.referrer,
  completed.completed_at,
  coalesce(completed.completed_at is not null, false) as completed,
  completed.worry_choice,
  completed.r1_choice,
  completed.r1_correct,
  completed.r1_ms,
  completed.r2_choice,
  completed.r2_correct,
  completed.r2_ms,
  completed.r3_choice,
  completed.r3_correct,
  completed.r3_ms,
  completed.r4_choice,
  completed.r4_correct,
  completed.r4_ms,
  completed.reflection_choice,
  completed.score,
  closed.closed_at,
  closed.closed_screen
from
  (
    select
      session_id,
      min(created_at) as started_at,
      min(user_agent) as user_agent,
      min(payload ->> 'referrer') as referrer
    from public.game_events
    where event_type = 'session_start'
    group by session_id
  ) started
  left join (
    select distinct on (session_id)
      session_id,
      created_at as completed_at,
      payload ->> 'worry' as worry_choice,
      payload -> 'r1' ->> 'choice' as r1_choice,
      (payload -> 'r1' ->> 'correct')::boolean as r1_correct,
      (payload -> 'r1' ->> 'ms')::int as r1_ms,
      payload -> 'r2' ->> 'choice' as r2_choice,
      (payload -> 'r2' ->> 'correct')::boolean as r2_correct,
      (payload -> 'r2' ->> 'ms')::int as r2_ms,
      payload -> 'r3' ->> 'choice' as r3_choice,
      (payload -> 'r3' ->> 'correct')::boolean as r3_correct,
      (payload -> 'r3' ->> 'ms')::int as r3_ms,
      payload -> 'r4' ->> 'choice' as r4_choice,
      (payload -> 'r4' ->> 'correct')::boolean as r4_correct,
      (payload -> 'r4' ->> 'ms')::int as r4_ms,
      payload ->> 'reflection' as reflection_choice,
      (payload ->> 'score')::int as score
    from public.game_events
    where event_type = 'session_complete'
    order by session_id, created_at desc
  ) completed using (session_id)
  left join (
    select distinct on (session_id)
      session_id, created_at as closed_at, screen as closed_screen
    from public.game_events
    where event_type = 'session_closed'
    order by session_id, created_at desc
  ) closed using (session_id);

-- ----------------------------------------------------------------------------
-- Handy queries once data is flowing (run these in the SQL Editor):
--
-- Completion rate:
--   select count(*) filter (where completed) * 100.0 / count(*) as completion_pct
--   from public.session_summary;
--
-- Drop-off funnel — where people abandon before finishing:
--   select closed_screen, count(*) from public.session_summary
--   where not completed group by closed_screen order by count(*) desc;
--
-- Average score of completed sessions:
--   select avg(score) from public.session_summary where completed;
--
-- Per-question breakdown (e.g. how often each round is answered correctly):
--   select screen, payload ->> 'correct' as correct, count(*)
--   from public.game_events
--   where event_type = 'question_answered' and screen like 'round%'
--   group by screen, correct order by screen;
-- ----------------------------------------------------------------------------
