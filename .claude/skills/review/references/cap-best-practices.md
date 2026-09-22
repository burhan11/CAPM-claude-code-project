# CAP Review Reference — What to Look For

Detailed checks per review area. Load this when performing the review. Each item
notes *why* it matters so findings can be explained, not just flagged. File/line
evidence is required for every finding — never report a problem you haven't seen
in the actual source.

---

## 1. Endpoint protection (authorization)

CAP services expose entities as OData/REST endpoints. Without auth annotations,
behaviour depends on `cds.requires.auth`: with `mocked`/`dummy` (the dev default)
everything is open; with `xsuaa`/`ias` an unannotated service still only requires
a valid token, so *any* authenticated user can read/write everything. Explicit
annotations are the control.

Check every `service` and exposed `entity` in `srv/**.cds` for:

- **`@requires: 'authenticated-user'`** — minimum bar; blocks anonymous access.
- **`@requires: '<role>'`** — restricts to a scope/role.
- **`@restrict: [{ grant, to, where }]`** — fine-grained: per-operation (`READ`,
  `WRITE`, `CREATE`, `UPDATE`, `DELETE`, or `*`), per-role (`to`), and
  instance-based (`where: 'buyer = $user'`). This is the strongest control.
- **`@readonly` / `@insertonly`** — narrow the surface even for authorized users.

Red flags:
- A `service { ... }` block with no `@requires`/`@restrict` anywhere in it.
- Entities exposing sensitive data (users, prices, PII) without instance filters.
- `@requires: 'any'` or annotations that are present but effectively open.
- Auth configured as `mocked`/`dummy`/`basic` in the *production* profile
  (`cds.requires.[production].auth`) — check `package.json` / `.cdsrc.json`.
- Admin/technical services (e.g. `$batch`, background jobs) left unprotected.
- Custom handlers that fetch data without re-checking authorization when the
  entity-level `@restrict` can't express the rule.

Fix pattern:
```cds
service CatalogService @(requires: 'authenticated-user') {
  @restrict: [
    { grant: 'READ',  to: 'Viewer' },
    { grant: '*',     to: 'Admin'  },
    { grant: 'READ',  to: 'Buyer', where: 'buyer = $user' }
  ]
  entity Orders as projection on db.Orders;
}
```

---

## 2. xs-security.json

Required to define the XSUAA security descriptor: `xsappname`, `scopes`,
`attributes`, `role-templates`, and `role-collections`. `mta.yaml` binds the
`xsuaa` service instance to this file. Without it, roles referenced in
`@requires`/`@restrict` have nothing backing them and deployment auth breaks.

Checks:
- **Missing file** → warn (High). Roles in the model won't resolve at runtime.
- If present, verify the roles used in `@requires`/`@restrict` annotations have
  matching `scopes` and `role-templates` — a role referenced in CDS but absent
  here is a silent authorization gap.
- `xsappname` present and consistent with `mta.yaml`.
- `tenant-mode: shared` if the app is multitenant.
- No overly broad `$XSAPPNAME.Admin`-to-everyone grants.

---

## 3. Modularization

CAP rewards a layered, small-file structure. Look for:

- **Monolithic handler files** — a single `srv/service.ts` of 300+ lines doing
  many services' logic. CAP auto-wires `srv/<service-name>.ts` to
  `<service-name>.cds`; split by service. Large files also flagged by inventory.
- **Repeated logic** across handlers → extract to a shared module
  (`srv/lib/…`) or a reusable CDS aspect/function.
- **Business logic inline in handlers** that belongs in reusable services or
  `srv/lib` utilities.
- **God services** — one service exposing dozens of unrelated entities; consider
  splitting by bounded context.
- **Missing separation of `db/` (domain) vs `srv/` (service) models** — services
  should *project* domain entities (`as projection on db.X`), not redefine them.
- **Reuse via `using`** — duplicated type/aspect definitions that could be shared
  (`common.cds`, or `@sap/cds/common` for Country/Currency/Language).
- **Custom code that reimplements framework features** CAP already provides
  (generic CRUD, pagination, draft handling, input validation).

Frame these as "room for modularization" with a concrete extraction example, not
as errors.

---

## 4. Associations vs Compositions

CDS distinguishes the two, and misusing them is a common structural flaw.

- **`Composition of`** — a *contained*, owned child. Lifecycle is tied to the
  parent: deep insert/update/delete cascade, and the child has no independent
  existence (e.g. `Order` → `Items`). Drafts and OData deep operations rely on
  this. Use for parent/child ownership.
- **`Association to`** — a *reference* to an independent entity (e.g. `Order` →
  `Customer`). No cascade; the target lives on its own.

Checks:
- Parent/child modelled as `Association` where `Composition` is correct → items
  won't cascade, deep insert/draft breaks. Common in Fiori object pages.
- `Composition` used for shared/reference data (e.g. a Currency) → wrongly ties
  lifecycle and can cause accidental deletes.
- **Unmanaged associations** (`Association to X on …`) with hand-written `on`
  conditions — verify the join is correct and a managed association wouldn't be
  simpler.
- **Missing backlinks** — a `Composition of many Items on Items.parent = $self`
  needs the child's `parent` association to exist.
- **Referential integrity** — associations without `@assert.integrity` (or DB
  FK constraints disabled) can leave orphans. Note where integrity isn't enforced.
- **To-many without composition where deletes should cascade** — orphaned rows.

Fix pattern:
```cds
entity Orders : cuid, managed {
  customer : Association to Customers;          // reference — independent
  items    : Composition of many OrderItems     // ownership — cascades
               on items.parent = $self;
}
entity OrderItems : cuid {
  parent   : Association to Orders;             // backlink
  product  : Association to Products;
}
```

---

## 5. Data model & normalization

- **Keys** — every entity needs a key. Prefer the `cuid` aspect (UUID) over
  natural/business keys that may change. Flag missing or mutable keys.
- **`managed` aspect** — use for `createdAt/By`, `modifiedAt/By` instead of
  hand-rolled audit fields.
- **Redundant / derivable columns** — storing a value that can be computed
  (totals, full names, counts) risks drift. Suggest calculated elements or
  virtual fields unless there's a persistence reason.
- **Denormalization** — repeated groups of columns, copy-pasted address/contact
  blocks → extract an entity or reusable aspect. Repeating data that should be a
  1:n relation is a normalization smell.
- **`@sap/cds/common` types** — use `Country`, `Currency`, `Language`,
  `CodeList` instead of free-text codes; gives value help and consistency.
- **Localization** — user-facing text that varies by language should use
  `localized`.
- **Types & constraints** — right-sized `String(n)`, `Decimal(p,s)` for money
  (never `Double`), `@mandatory`, `@assert.range`, `@assert.format`,
  `@assert.unique` for business uniqueness.
- **Enums** — magic strings/status codes better modelled as enums or code lists.
- **Naming** — consistent PascalCase entities, plural entity names, camelCase
  elements; namespaces via `namespace`.

---

## 6. Overall CAP best practices (cross-cutting)

- **Layering**: `db/` (domain), `srv/` (services), `app/` (UI). DB entities not
  exposed directly — always projected in services so the API can evolve.
- **Input validation** at the model layer (`@mandatory`, `@assert.*`) rather than
  scattered handler checks.
- **Draft** (`@odata.draft.enabled`) on entities edited via Fiori object pages.
- **Error handling**: `req.error()` / `req.reject()` with codes and i18n message
  keys, not thrown strings or silent failures.
- **i18n**: texts in `_i18n/`/`i18n.properties`, not hard-coded strings.
- **Secrets**: no credentials, URLs, or keys hard-coded — use bound services /
  destinations / env, and check `default-env.json` isn't committed.
- **Persistence**: `@cds.persistence.skip` for non-persisted views;
  `@cds.persistence.exists` for external DB objects.
- **Testing**: presence of tests (`test/`, `@sap/cds` test helpers) for services.
- **Performance**: `@readonly` views, pagination, avoid N+1 in handlers, use
  `SELECT` with explicit columns.
- **Multitenancy**: if `@sap/cds-mtxs` is present, tenant isolation in custom
  queries.

---

## Severity guidance

- **🔴 Critical** — unprotected write endpoints, secrets in code, missing
  xs-security with XSUAA configured, data-loss-risking composition/association
  errors.
- **🟠 High** — read exposure of sensitive data, missing production auth config,
  referential integrity gaps, missing keys.
- **🟡 Medium** — modularization debt, normalization smells, missing validation,
  derivable stored columns.
- **🟢 Low / Nice-to-have** — naming, i18n, use of `@sap/cds/common`, tests.