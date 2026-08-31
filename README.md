# KLAXO

Turns the material you already revise from — notes, slides, chapters, past
papers, a photograph of a page — into a course with practice, and keeps track
of what you actually know rather than what you have read.

There is no sign-up and no login. You open it and your material is there.

## The app — this is the project

```bash
cd mastery-course-generator
npm install
npm run dev        # http://localhost:3000
```

Everything lives in `mastery-course-generator/`. It is a Next.js app with a
SQLite database on disk and a background worker that runs generation jobs.

**It starts with no AI connected**, which means courses are built from example
text rather than from your material. The app says so in a banner until you fix
it. Connecting one takes about five minutes and the first option is free:
[`docs/connect-an-ai.md`](mastery-course-generator/docs/connect-an-ai.md).
Keys are never committed — `.env` is ignored by git — so everyone who runs this
uses their own.

The app opens on **Study**: what is due for review, what you are weakest on, and
a button that starts practice. **Material** is where you add what you are
revising from and build it into a course.

## The website — optional

`site/` is a small public marketing site. It is **not required**: the app does
not import from it, does not link to it, and does not need it to run, build or
test. Nothing breaks if you delete the folder.

It is there in case this is ever shown to other people. If you want it:

```bash
cd site
npm install
npm run dev        # http://localhost:3200
```

Set `NEXT_PUBLIC_APP_URL` when building it so its buttons point at wherever the
app is running.

## Checks

CI runs typecheck, lint, tests and a build for the app, plus a build for the
site. Both must pass.

```bash
cd mastery-course-generator && npm run verify
```
