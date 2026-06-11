# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single self-contained file: [polla-mundial.html](polla-mundial.html). A World Cup 2026 betting-pool ("polla") web app in Spanish. There is no build step, package manager, tests, or backend of our own — open the file in a browser to run it. All HTML, CSS (in `<style>`), and JS (in `<script>`) live in that one file.

## Architecture

The app fetches live tournament data from the external **wcup2026.org API** (`API_BASE = https://wcup2026.org/api/data.php`, polled every 30s) and overlays a local "polla" where the admin assigns each participant a country. A participant stays "in the running" as long as their team is alive; points are ranked by how far the team advances.

Key flow inside the `<script>`:

- **Two data layers, two storage keys.** Participants + admin creds persist in `localStorage` under `STORAGE_KEY` (`polla_mundial_data`) — this is the only user-owned data and is saved via `saveData()`. Tournament data (teams/games/groups) is cached separately under `CACHE_KEY` (`polla_mundial_cache`) for offline fallback. The central `state` object holds everything in memory.

- **API adapter layer.** The wcup2026 API shape is normalized into the app's internal model. `convertMatch()` maps each raw match to the internal game object; `buildTeamsFromData()` / `buildGroupsFromStandings()` derive teams and group tables from standings. `syncData()` orchestrates the fetch → convert → `computeTeamStatus()` → `renderAll()` cycle, falling back to `loadCache()` on network error.

- **Team identity & i18n.** Teams are keyed by a slug (`teamSlug()` → lowercased, hyphenated English name). `canonicalTeam()` + `TEAM_ALIASES` reconcile naming differences from the API; `TEAM_ES` / `getTeamName()` translate English names to Spanish for display. Placeholder teams in knockout brackets (e.g. `W49`, `L50`) are detected by `isPlaceholderTeam()` and shown as "TBD". When editing team logic, keep slug, alias, and ES-name maps in sync.

- **Elimination logic** (the core domain rules): `getQualifiedTeams()` computes group winners/runners-up + best-8 third places (sorted by pts → gd → gf); `getKnockoutLosers()` and `getTeamCurrentStage()` walk knockout rounds (`r32→r16→qf→sf→final`) to decide each team's furthest stage and whether it's eliminated. `getParticipantStatus()` projects a team's status onto its participant for rankings/stats. Note: penalty-shootout outcomes are NOT in the API — ties in knockout games are an unhandled edge case (see comment in `getKnockoutLosers()`).

- **Rendering** is plain string-templating into `innerHTML`. `renderAll()` calls the per-section renderers (`renderMatches`, `renderRankings`, `renderGroups`, `renderStats`, `renderPhaseFilter`). Three tabs (Partidos / Rankings / Grupos) toggle via the `.section.active` class.

- **Admin.** Client-side-only auth (`DEFAULT_ADMIN` = `admin` / `mundial2026`), gated by a `sessionStorage` flag. The admin modal adds/removes participants (name + country + wagered points). This is cosmetic security — credentials live in localStorage and JS; do not treat it as real access control.

## Conventions

- UI copy and code comments are in **Spanish**; keep that consistent.
- Stage codes used throughout: `group`, `r32`, `r16`, `qf`, `sf`, `third`, `final`, plus synthetic `champion` / `eliminated`. Ordering lives in `STAGE_ORDER`, labels in `STAGE_LABELS`.
