# Hakcathon Backend

NestJS 11 project. Express adapter.

## Role

You are a senior NestJS developer. Always apply NestJS-first
patterns and architecture decisions, not generic Node.js approaches.

## Code standards

- Never instantiate services directly (no `new PrismaClient()`,
  no `new SomeService()`) — always use constructor injection
- Every infrastructure integration gets its own module and service:
  src/lib/database/prisma.module.ts + prisma.service.ts
  src/lib/mail/mail.module.ts + mail.service.ts
- Mark infrastructure modules @Global() and import once in AppModule
- Feature modules go in src/module/<name>/
- Shared guards, interceptors, decorators go in src/common/
- Use Nest CLI: nest g module / nest g service / nest g controller

## Skills

Do not load any skill by default. Check the task first — only invoke a skill if it matches the exact trigger below. Never invoke a skill just because it exists.

### Core workflow skills (in order of typical usage)

- `/scope` — turn a product idea into a living, coarse plan in docs/scope/. Run bare `/scope` to reconcile after shipping and queue what is next
- `/architect` — design a feature, choose between approaches, pick a tech stack, or settle any load bearing decision before building. Writes specs to docs/specs/
- `/develop` — build a feature (UI or backend) from an approved spec. Gates on the spec so decisions are made before code
- `/check verify` — drive the real app to prove a change works against its spec (every acceptance criterion met)
- `/check review` — run a senior code review on a fresh model before a PR. Writes findings to docs/reviews/
- `/test` — write a test suite for code you just built or changed. Targets uncommitted changes, asks for framework if absent
- `/document` — write PR descriptions, changelog entries, release notes, or postmortems from real commits and diffs
- `/sync` — run as the last step after a change is complete to keep AGENTS.md, scope, and specs current

### Supporting skills

- `/audit` — bootstrap or update project AI context (AGENTS.md files). Run on greenfield, brownfield without docs, or one area
- `/debug` — find and fix a bug's root cause with a structured reproduce, localize, hypothesize, test, fix, verify loop

## Session continuity

The `.agents` folder contains a complete Agent Skills workflow system with:
- 9 core skills (scope, architect, audit, develop, check, test, document, debug, sync)
- Each skill has bundled files: agent prompts, mode files, templates, and guides
- Skills coordinate through shared artifacts in docs/scope/ and docs/specs/
- Context lives in AGENTS.md files (root and nested per area)

**Workflow memory lives in the artifacts, not chat memory:**
- Scope: docs/scope/ tracks what to build, status, and order
- Specs: docs/specs/ holds decisions and build plans
- Context: AGENTS.md documents conventions and stack
- Reviews: docs/reviews/ stores code review findings

**Session startup:** Check docs/scope/ for in-progress features and their resume points. The scope doubles as "where was I, what's safe to pick up" orientation.

**Between sessions:** Run `/sync` after completing work to reconcile AGENTS.md, scope, and specs to repo state. This keeps the next session's context accurate.
