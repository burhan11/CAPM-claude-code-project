---
name: cap-project-review
description: Review a SAP BTP CAP (Cloud Application Programming Model) project for security, structure, data-model, and best-practice issues. Use this whenever the user asks to review, audit, check, or assess a CAP application, a CAP backend, `.cds` service or domain models, or a project containing a `srv/`, `db/`, `app/` layout or `@sap/cds`. Triggers include "review my CAP project", "check my CDS model", "is my service secure", "audit my BTP app", "are my endpoints protected", "check associations/compositions", or any request to evaluate CAP code quality — even if the user only mentions one aspect (e.g. just authorization, or just the data model), run the relevant parts of this review rather than answering ad hoc.
---

# CAP Project Review

Systematically review a SAP CAP project and produce a prioritized, evidence-based
report. The review covers six areas: (1) endpoint protection, (2) xs-security.json,
(3) modularization, (4) associations & compositions, (5) data model & normalization,
and (6) cross-cutting CAP best practices.

Two principles throughout:
- **Evidence first.** Every finding cites a real file and location you have read.
  The inventory script is a lead generator, not a source of truth — regex can
  miss or misclassify. Confirm by reading the actual `.cds`/handler code before
  reporting anything.
- **Explain, don't just flag.** Say *why* each issue matters (what breaks, what
  risk it carries) and show a concrete fix. The reader is a CAP developer who
  wants to learn the reasoning, not just a checklist.

## Workflow

### Step 1 — Locate and inventory the project

Find the project root (the folder with `package.json` referencing `@sap/cds`,
usually alongside `srv/`, `db/`, `app/`). If several candidates exist, ask which.

Run the inventory scanner for a fast factual baseline:

```bash
node <skill-path>/scripts/inventory.js <project_root>
```

It reports: key files present (`xs-security.json`, `mta.yaml`, `.cdsrc.json`,
`xs-app.json`), configured auth kind, every service/db `.cds` file with its
annotations, handler files with sizes, and pre-computed flags (services with no
auth annotation, missing xs-security, large files). Use this to decide what to
read — do not paste it to the user or treat its flags as final findings.

### Step 2 — Read the reference and the flagged files

Read `references/cap-best-practices.md` — it holds the detailed per-area checks,
fix patterns, and severity guidance. Then read the source the inventory flagged,
plus at minimum: all `srv/**.cds`, all `db/**.cds`, the largest handler files,
`xs-security.json` (if present), and `package.json`/`.cdsrc.json` for the auth
config. For anything ambiguous, read the file rather than guessing.

### Step 3 — Analyze each area

Work through all six areas using the reference. Map the user's five explicit
asks onto them:

1. **Endpoint protection** — every `service`/exposed `entity` in `srv/` has
   appropriate `@requires`/`@restrict`; production auth isn't `mocked`/`dummy`;
   sensitive data has instance-level filters.
2. **xs-security.json** — present? If missing, warn (roles won't resolve). If
   present, roles used in the model have matching scopes/role-templates.
3. **Modularization** — oversized handlers, duplicated logic, god services, DB
   entities exposed without projection, reuse opportunities.
4. **Associations & compositions** — ownership modelled as `Composition`,
   references as `Association`; backlinks present; referential integrity;
   unmanaged `on` conditions correct.
5. **Data model & normalization** — keys present (prefer `cuid`), `managed` for
   audit, no derivable/redundant columns, denormalization smells, right types
   (`Decimal` for money), validation annotations, `@sap/cds/common` codes.

Then sweep the cross-cutting best practices (layering, validation, drafts, error
handling, i18n, secrets, tests) from area 6 of the reference.

If the user asked for only one area, run that area in full plus a quick pass of
anything security-critical you happen to see — don't withhold a 🔴 finding
because it's "out of scope."

### Step 4 — Write the report

Use the structure below. Order findings by severity (🔴 → 🟢). Every finding:
one-line problem statement, the file/location, why it matters, and a concrete
fix (a short before/after `cds` snippet where it helps). Be concise and technical.

## Report structure

Use this template:

```markdown
# CAP Project Review — <project name>

## Summary
<2–4 sentences: overall health, the most important 1–3 things to fix, and what's
already done well. Give a rough count by severity.>

## 🔒 1. Endpoint protection
<Findings with severity tag, file:location, why it matters, fix. If everything is
protected, say so and note the strongest evidence.>

## 📄 2. xs-security.json
<Present/missing verdict + warning if missing. Role/scope consistency findings.>

## 🧩 3. Modularization
<Room-for-improvement findings with a concrete extraction example each.>

## 🔗 4. Associations & compositions
<Ownership vs reference correctness, backlinks, integrity.>

## 🗄️ 5. Data model & normalization
<Keys, redundancy, normalization, types, validation.>

## ✅ 6. Other best practices
<Layering, validation, drafts, error handling, i18n, secrets, tests.>

## Prioritized action list
1. <highest-impact fix>
2. ...
```

## Notes

- If the project isn't actually a CAP project (no `@sap/cds`, no `srv/`), say so
  and stop rather than forcing the template.
- Deliver the report inline in the reply by default (a CAP dev wants to act on it
  fast). Offer to save it as a Markdown file if the user wants to keep or share it.
- Don't invent line numbers or annotations. If the inventory flagged something but
  the file shows it's actually handled (e.g. auth applied via a `.cds` aspect or
  a service-level annotation the regex missed), report it as fine and move on.
- Prefer CAP-native fixes (model annotations, aspects, projections) over custom
  handler code, matching how the framework is meant to be used.