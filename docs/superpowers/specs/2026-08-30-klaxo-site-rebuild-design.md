# KLAXO — site repositioning, identity and phone-first rebuild

**Date:** 2026-08-30
**Status:** approved, ready to build
**Surfaces:** `site/` (public marketing site) and `mastery-course-generator/` (the app)

---

## Why

The site launched last week reads as a document. It leans on being free and
open source, which will probably stop being true when the app is released; it
asks people to read six paragraphs before they see anything; its main button
promises to open the app and instead asks for an email; the hero's connecting
lines cut through sentences; page changes leave the reader part-way down the
new page; and both surfaces are a laptop layout at a smaller size rather than
a design meant for a phone.

## What is changing

### 1. The pitch: "it shows its work"

The competitor is not another curriculum tool. It is a chatbot the teacher
already has. A chatbot will write a scheme of work in thirty seconds; what it
will not do is let you check it. KLAXO's claim is that every lesson, question
and objective traces back to the page it came from, and that a separate pass
audits the course against those sources.

Everything else the product does — the dependency ordering, the practice, the
mastery tracking — stays on the site as support for that claim, not as the
headline.

**Retired entirely:** "open source", "self-hostable", "bring your own AI
provider", and anything implying the code is public. These do not appear
anywhere on the site, in metadata, or in link text.

### 2. The way in: a guest session, not a signup

The primary button opens the builder. No email, no password. The app already
supports guest sessions (`POST /api/auth/bootstrap`); it is simply not the
front door.

- New app route `GET /start` — bootstraps a guest session, creates an empty
  course, and redirects to that course's builder. If a session already exists
  it is reused, so an existing user is not given a second identity.
- The site's primary button points at `/start`; secondary points at `/login`.
- Under the button, one line: "No account needed. Sign up later to keep it."
- Button copy: **Start a course** (header), **Start a course — free** (hero).
  Never "Open KLAXO", which promised what it did not do.

### 3. Pricing honesty

`/free-and-open` becomes `/what-it-costs`:

- Free while it is in beta. No card, no seat limit.
- Said plainly that pricing may change, and that anything built stays yours.
- No open-source claim, no self-hosting tier. The hosted/self-hosted pair of
  cards goes; educators are not buying infrastructure.

### 4. Identity: "The Citation"

Lines of a course, one of them tracing down and out to a dot — the source it
came from. Drawn as a single inline SVG, three sizes (26px tile, 18px tile,
large), ink tile with paper glyph in light, paper tile with ink glyph in dark.
Rose is used only for the trace and the dot at large sizes; at tile sizes the
mark is monochrome so it survives at 18px.

The same component ships in both projects so the surfaces match.

### 5. Homepage: longer, fuller, far less to read

Eight sections. The ones marked ▣ are mostly picture with a line or two of
text:

1. ▣ **Hero** — claim, two buttons, and the sources-to-spine diagram.
2. ▣ **One unit, before and after** — the centrepiece. A pile of real material
   on the left; the finished ordered course on the right.
3. ▣ **Where this line came from** — a generated lesson with its source page
   pinned beside it, the trace drawn between them. This is the pitch, shown.
4. **The four passes** — kept, but a small drawing and a short label each.
5. ▣ **Who has actually met it** — a mastery grid: objectives down, students
   across, filled in.
6. **One link, no accounts** — the student join screen at phone size.
7. **Three short answers** — accuracy, your material, cost. A sentence each.
8. **Close** — the same button, on the ink band.

Copy budget: no paragraph longer than two sentences anywhere on the site, and
section ledes capped at one.

### 6. The hero diagram

The beams currently anchor to element centres, so they run through the text.
They must join **edge to edge**: leave the right edge of a source card, enter
the left edge of an objective card, and never cross a card's interior. The
`AnimatedBeam` component gains explicit anchor sides rather than offsets
guessed by eye.

### 7. Scroll position on navigation

`template.tsx` remounts per navigation but does not reset scroll, so a page
change lands part-way down. Reset to the top on pathname change, before paint,
and keep it out of the way of the enter animation. Anchor links and back/forward
restoration must still work.

### 8. Dark mode for the site

Follows `prefers-color-scheme`, no toggle — the same rule the app uses, and the
same palette it already uses so the two match:

| | Light | Dark |
|---|---|---|
| ground | `#E6E8EF` | `#12141E` |
| card | `#FAFAFC` | `#1B1F2C` |
| raised | `#F2F3F8` | `#232838` |
| ink | `#191C2B` | `#E9EBF2` |
| prose | `#4C5268` | `#B4BACB` |
| muted | `#6E7488` | `#939AAF` |
| border | `rgba(25,28,43,.15)` | `#2E3446` |
| accent | `#A9375C` | `#D96A8B` |

Rose buttons take dark ink labels in dark mode; `#D96A8B` is too light for
white text. The two soft background lights are re-tuned for the dark ground
rather than left as-is.

### 9. Phone-first, both surfaces

Not the laptop layout narrowed. Specifically:

**Site**
- A slim action bar pinned to the bottom once the hero scrolls away, holding
  "Start a course", above the home indicator (`env(safe-area-inset-bottom)`).
- The hero diagram is redrawn for the phone as a single vertical run — source,
  then the objective it produced — with the trace running down between them,
  rather than a two-column layout stacked.
- Type scale, section padding and line length tuned for 390px.

**App**
- The builder's seven-step bar becomes "Step 2 of 7", the current step named,
  a progress bar, and Back/Next pinned to the bottom.
- The workspace's seven tabs become a swipeable snapping strip that always
  keeps the selected tab in view.
- The bottom bar carries My courses and Account rather than one lonely tab.

**Both:** nothing tappable under 44px, inputs at 16px, safe-area padding top
and bottom, nothing that depends on hover.

## Out of scope

- Any change to how courses are generated.
- The `teacher` role name in the database.
- A pricing model. "Free while in beta" is a statement of fact, not a plan.

## How it gets verified

Typecheck, lint and build clean on both projects. Then every page of the site
and every screen of the app opened and looked at, in both themes, at 1280px and
390px — including the guest entry actually landing in the builder.
