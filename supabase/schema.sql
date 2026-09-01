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

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- schools — one row per school/partner a link can be attributed to. Looked
-- up by game.js from the `?school=CODE` URL parameter (e.g.
-- ?school=DPS_NOIDA) at load time; the browser only ever SELECTs a matching
-- ACTIVE row by code — it can never insert/update/delete, so a leaked
-- publishable key can't be used to plant or alter attribution data. Add new
-- schools from the SQL Editor (see the INSERT template at the bottom of this
-- file) or the Table Editor — never from the app itself. Created before
-- game_events below because game_events.school_id references it.
-- ----------------------------------------------------------------------------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  school_code text not null unique,
  school_name text not null,
  salesperson_id text,
  salesperson_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.schools enable row level security;

drop policy if exists "anon can read active schools" on public.schools;
create policy "anon can read active schools"
  on public.schools
  for select
  to anon
  using (is_active = true);
-- Deliberately no insert/update/delete policy for anon — schools are managed
-- only from the Supabase SQL editor / dashboard (service role or a logged-in
-- user), never from the browser.

create table if not exists public.game_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  event_type text not null check (
    event_type in (
      'session_start', 'question_answered', 'session_complete', 'session_closed',
      'kid_game_started', 'kid_game_answered', 'kid_game_cfu', 'mission_list_opened'
    )
  ),
  screen text,
  payload jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now(),
  school_id uuid references public.schools(id),
  salesperson_id text
);

create index if not exists game_events_session_id_idx on public.game_events (session_id);
create index if not exists game_events_type_created_idx on public.game_events (event_type, created_at);
create index if not exists game_events_school_id_idx on public.game_events (school_id);

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
--
-- "Challenge 1" (event screen key "round1") is a 4-image sequence scored as
-- score/scoreMax rather than a single choice/correct/ms answer, hence
-- r1_score/r1_score_max/r1_timed_out below instead of r1_choice/r1_correct/
-- r1_ms. "Challenge 2" (screen key "round2") is still a single MCQ, so its
-- r2_choice/r2_correct/r2_ms are unchanged. The old rounds 3/4 were removed
-- from the app entirely, so there are no r3_*/r4_* columns for new sessions.
-- ----------------------------------------------------------------------------
drop view if exists public.session_summary;

create view public.session_summary as
select
  started.session_id,
  started.started_at,
  started.user_agent,
  started.referrer,
  started.school_id,
  sc.school_code,
  sc.school_name,
  started.salesperson_id,
  sc.salesperson_name,
  completed.completed_at,
  coalesce(completed.completed_at is not null, false) as completed,
  completed.worry_choice,
  completed.r1_score,
  completed.r1_score_max,
  completed.r1_timed_out,
  completed.r2_choice,
  completed.r2_correct,
  completed.r2_ms,
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
      min(payload ->> 'referrer') as referrer,
      min(school_id::text)::uuid as school_id,
      min(salesperson_id) as salesperson_id
    from public.game_events
    where event_type = 'session_start'
    group by session_id
  ) started
  left join public.schools sc on sc.id = started.school_id
  left join (
    select distinct on (session_id)
      session_id,
      created_at as completed_at,
      payload ->> 'worry' as worry_choice,
      (payload -> 'r1' ->> 'score')::int as r1_score,
      (payload -> 'r1' ->> 'scoreMax')::int as r1_score_max,
      coalesce((payload -> 'r1' ->> 'timedOut')::boolean, false) as r1_timed_out,
      payload -> 'r2' ->> 'choice' as r2_choice,
      (payload -> 'r2' ->> 'correct')::boolean as r2_correct,
      (payload -> 'r2' ->> 'ms')::int as r2_ms,
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
-- kid_game_summary — one row per "Can You Spot the Fake AI?" playthrough
-- (the kids mini-game launched from the close screen's "Your child's turn"
-- button), reconstructed from the three kid_game_* event types below.
-- session_id matches session_summary.session_id — the browser keeps the
-- same session across the parent→child handoff — so the two views can be
-- joined to see e.g. "did this parent's child also play, and how did they
-- do," including school/salesperson attribution from session_summary.
-- Dropped and recreated for the same reason as session_summary above.
-- ----------------------------------------------------------------------------
drop view if exists public.kid_game_summary;

create view public.kid_game_summary as
select
  started.session_id,
  started.started_at,
  answered.answered_at,
  answered.answers,
  answered.score,
  answered.score_max,
  answered.timed_out,
  cfu.cfu_choice,
  cfu.cfu_at
from
  (
    select session_id, min(created_at) as started_at
    from public.game_events
    where event_type = 'kid_game_started'
    group by session_id
  ) started
  left join (
    select distinct on (session_id)
      session_id,
      created_at as answered_at,
      payload -> 'answers' as answers,
      (payload ->> 'score')::int as score,
      (payload ->> 'scoreMax')::int as score_max,
      coalesce((payload ->> 'timedOut')::boolean, false) as timed_out
    from public.game_events
    where event_type = 'kid_game_answered'
    order by session_id, created_at desc
  ) answered using (session_id)
  left join (
    select distinct on (session_id)
      session_id, created_at as cfu_at, payload ->> 'choice' as cfu_choice
    from public.game_events
    where event_type = 'kid_game_cfu'
    order by session_id, created_at desc
  ) cfu using (session_id);

-- ----------------------------------------------------------------------------
-- Add a new school — run this in the SQL Editor whenever you want to create
-- a new attribution link. No app code changes needed: as soon as the row
-- exists with is_active = true, links like
-- https://your-app.vercel.app/?school=SCHOOL_CODE start attributing.
--
--   insert into public.schools (school_code, school_name, salesperson_id, salesperson_name)
--   values ('SCHOOL_CODE', 'School Display Name', 'SP-001', 'Salesperson Name');
--
-- To retire a school's link without deleting its history, flip is_active:
--   update public.schools set is_active = false where school_code = 'SCHOOL_CODE';
-- ----------------------------------------------------------------------------

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
--
-- Of parents who finished, how many handed off to their child:
--   select count(*) filter (where k.session_id is not null) * 100.0 / count(*) as handoff_pct
--   from public.session_summary s
--   left join public.kid_game_summary k using (session_id)
--   where s.completed;
--
-- Average kid score, and how often "Not sure" (confused) shows up:
--   select avg(score::numeric / score_max) as avg_kid_score_pct,
--          avg((select count(*) from jsonb_each_text(answers) a where a.value = 'confused')) as avg_confused_per_play
--   from public.kid_game_summary where score is not null;
--
-- Sessions and completion rate by school:
--   select coalesce(school_name, 'unattributed') as school, count(*) as sessions,
--          count(*) filter (where completed) * 100.0 / count(*) as completion_pct
--   from public.session_summary group by school_name order by sessions desc;
-- ----------------------------------------------------------------------------
