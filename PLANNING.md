# How I planned and built this with Claude Code

This is the planning record for the take-home. The short version: I planned before writing code,
worked in phases, and treated "it compiles" as the beginning of verification rather than the end.

## 1. Decisions I made before any code

Three choices shaped everything else, so I settled them first rather than discovering them mid-build.

- **Neon Postgres over a browser database.** The brief allows an in-browser DB, but it also requires
  server functions. A browser-only store would have reduced those to a formality. A real database
  keeps every read and write crossing a server boundary.
- **The URL as application state.** Search, status, and sort live in URL search params rather than
  component state, so a filtered view is shareable and survives a refresh.
- **Scope discipline.** The seven criteria plus polish. No auth, no realtime — both are easy to start
  and expensive to finish, and neither was asked for.

## 2. The plan

I had Claude Code produce a phased plan and a data model before implementation, then worked through
it one phase at a time. Each phase ends in a green build and a single commit.

| Phase | Scope                                       | Criteria |
| ----- | ------------------------------------------- | -------- |
| 0     | Scaffold, tooling, deploy target check      | —        |
| 1     | Schema, migrations, seed, config layer      | —        |
| 2     | Server functions with shared Zod validation | —        |
| 3     | List, search, status filter                 | 2, 5, 6  |
| 4     | Create, update, delete, undo                | 1, 3, 4  |
| 5     | Command palette and shortcuts               | 7        |
| 6     | Loading states and polish                   | —        |
| 7     | Deploy, README                              | —        |

Phases 0–4 are complete; 5–7 are in progress.

## 3. How I worked with the agent

**Directed, not delegated.** I chose the stack, the scope, and the data model. The agent drafted
implementations and — more usefully — proved them.

**Verification was the requirement, not the build passing.** Every phase had to be demonstrated
against the live database or a real browser before it counted as done: 31 assertions against the
data layer, SSR output checked with `curl`, optimistic updates sampled 60ms after a click, and the
rollback path tested by patching `fetch` to fail on purpose.

**Conventions enforced in the repo, not in prose.** Rather than asking the agent to remember that
only one module may read `process.env`, that became an ESLint rule which fails the build.

## 4. What verification actually caught

This is the part I would want a reviewer to look at. Each of these passed type-checking and the
build, and would have shipped unnoticed:

- **An SSR hydration mismatch.** A button label rendered fetch state, and with `staleTime: 0` the
  query refetched the instant it hydrated, so server and client markup disagreed. Fixed at the
  source rather than silenced.
- **HTTP 500 on a hand-edited URL.** `?status=bogus` crashed the page. Split into a strict schema for
  server-function input and a tolerant one for URL params, which now degrade to defaults.
- **Silent no-op callbacks.** React Query does not run callbacks passed to `mutate()` if the
  component unmounts first — and an optimistic delete unmounts the row immediately. The undo toast
  never appeared, and error handling was unreachable. Moved into the hook definitions.
- **Invisible text in dark mode.** Nothing set a base foreground colour, so titles rendered
  near-black on near-black.
- **Dead code I had just written.** I added a Suspense skeleton, then tested whether it could ever
  render. It could not: the route loader always primes the cache, so the query never suspends. I
  deleted it instead of shipping a fallback that cannot fire.

## 5. What I would do differently

Check the deployment target in phase 0 rather than trusting it, and add a Playwright happy path
early — several of the bugs above were found by hand-driving a browser, which a test would catch on
every commit.
