# KLAXO — back to a personal study app

**Date:** 2026-08-31
**Status:** approved, ready to build
**Supersedes the product framing in** `2026-08-30-klaxo-site-rebuild-design.md`
(the engineering decisions in that spec still stand)

---

## What changed

KLAXO was never meant to be a SaaS. It is Xavier's personal app for revising
for an AP Cybersecurity exam: he puts in his own material and gets study
material back — "could be a course or practice, just kind of study materials".

The pipeline we built is right. Everything wrapped around it is aimed at the
wrong person: it treats the user as a **teacher** who builds a course, shares a
link with a class, and tracks which students met which objective. Xavier is the
student. Accounts, roles, share links, sign-up funnels and marketing pages are
all scaffolding he would never touch.

## Decisions

1. **One user, no accounts.** He opens it and his material is there.
2. **Practice and test prep lead.** He has an exam. Question banks, quizzes and
   "what am I weak on" come first; the structured course is what organises them.
3. **The website stays in the repo, clearly marked optional.** Xavier had a
   landing page in his own repo, so he may want one later. It must not be
   something a person has to run, understand, or strip out to use the app.
4. **Subject-agnostic.** No AP Cybersecurity hard-coding. It should work on
   whatever he feeds it.

## Design

### Solo mode — removing accounts without gutting the app

Every API route authorises through `requireUserId()`, and every course row is
owned by a `userId`. Ripping that out would touch the whole server for no gain,
and would make the app impossible to open up again later if he ever wants that.

So: keep ownership in the data model, remove identity from the experience.

- A single local user is provisioned on first run and used for every request.
  `src/lib/solo.ts` owns this: it returns the one user id, creating the row if
  it does not exist. `readSession()`/`requireUserId()` fall back to it, so the
  API keeps working unchanged.
- **Deleted from the app:** `/login`, `/account`, `/api/auth/*` (login, signup,
  logout, me, bootstrap), the `/start` guest route, the account menu, the
  sign-in and sign-up buttons, and the middleware that redirected to sign-in.
- **Deleted with them:** the teacher/student role branches in the UI, the share
  panel, and the `/learn/[token]` student route. Sharing a course with a class
  is a classroom feature, and there is no class.
- The database keeps its `users`, `role` and share tables. Nothing is dropped;
  the app simply stops using them, which keeps the migration story simple and
  leaves the door open.

### Practice first

The app currently opens on a course list and buries practice inside a workspace
tab. For someone revising, that is backwards.

- **Home becomes "Study"**: for each set of material, what is due, what is weak,
  and a button that starts practice immediately.
- **Practice is a first-class screen**, not a tab: a run of questions drawn
  across the whole course, weighted toward objectives with low mastery.
- **The workspace keeps everything else** — curriculum, lessons, assessments,
  mastery, versions — for when he wants to read rather than drill.
- **The builder** still produces the full structured course; nothing about
  generation changes. It just stops being the front door.

### The website, optional

- Stays at `site/`, with its own package, port and deploy.
- The repo README states plainly that the app is the project and the site is
  optional — nothing in the app imports from it, and nothing in it is required
  to run, build or test the app.
- The app's outbound links to the site (`NEXT_PUBLIC_SITE_URL`) become optional:
  when it is unset, the app shows no links out at all.
- The site keeps pointing at the app, but at the app's home rather than at
  `/start`, which no longer exists.

## Out of scope

- Changing how courses are generated.
- Dropping any database table or column.
- Anything AP Cybersecurity specific.

## How it gets verified

Typecheck, lint and build clean on both projects. Then: open the app with no
cookies at all and confirm it goes straight to the study screen with no sign-in;
build a course; run a practice session; and check every screen at 1280px and on
the booted iPhone, in both themes.
