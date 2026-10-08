I want to enhance my SAP CAP project. Do NOT modify any files yet. First investigate,
then present a plan, and wait for my explicit approval before making any change.

## Goal
1. Add a login screen in app/travellers that appears before the Traveller app opens.
   - Fields: User ID and Password, plus a Login button.
   - Design: simple and clean (centered card, app title, clear error message on
     failed login, Enter key submits, responsive on mobile). Use standard SAPUI5
     controls and theming. No custom CSS frameworks.
   - On successful login as a Traveller or Admin user, navigate to the existing
     Traveller page. Invalid credentials stay on the login screen with an error.
   - Admin and Traveller should see what their role permits (e.g. Admin can edit
     everything; Traveller has restricted access). Propose the exact rules.
2. Make any service and security changes needed to support this (roles, auth
   annotations, auth configuration).

## How to work: use subagents in parallel for investigation
Launch these subagents at the same time, each returning a short written summary:
- UI subagent: analyze app/travellers (manifest.json, routing, views, controllers,
  Component.js, how the app is launched, whether it's Fiori Elements or freestyle).
  Report how a login view can be added as the initial route.
- Service subagent: analyze srv/ and db/ (services, entities, existing
  @requires/@restrict annotations, custom handlers). Report which endpoints the
  Traveller app uses and how they are currently protected.
- Security/config subagent: analyze package.json, .cdsrc.json, xs-security.json,
  mta.yaml, and any approuter (xs-app.json). Report the current auth kind for dev
  and production, existing roles/scopes, and how the app is deployed.

## Important: authentication approach
A custom username/password form is the right fit for local development with CAP
mocked/basic auth, but on BTP the standard and secure approach is XSUAA or IAS
login via the approuter, where the app never handles passwords directly.
In the plan:
- Explain how the login screen will validate credentials in local dev
  (e.g. mocked users in cds.requires.auth.users with roles Traveller and Admin).
- Explain what happens in production on BTP, and recommend the secure option.
  If a custom login form would weaken security in production, say so clearly and
  propose alternatives (e.g. custom-branded XSUAA/IAS login page, or the custom
  screen only in dev).
- Never hard-code passwords in UI code or store them in browser storage.

## Plan format
Present:
1. Findings summary from each subagent.
2. The proposed authentication approach for dev and production, with trade-offs.
3. A file-by-file list of changes: path, create or modify, what changes and why.
4. Role and authorization matrix: role × entity × allowed operations.
5. Test plan: how I can verify login as Traveller, as Admin, and with invalid
   credentials, plus checks that endpoints reject unauthorized access.
6. Risks or open questions for me.

Then STOP and ask me to confirm. After I approve, implement step by step, and
ask again before any change that is outside the approved plan.