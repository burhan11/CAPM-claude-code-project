#!/usr/bin/env node
/*
 * CAP project inventory scanner (Node.js, zero dependencies).
 *
 * A fast first pass over a SAP CAP project. It does NOT replace reading the
 * files — regex parsing of CDS is approximate — but it grounds the review in
 * facts: what exists, which services carry auth annotations, and which key
 * security files are present. Read the flagged files afterwards to confirm
 * before reporting anything.
 *
 * Usage:  node inventory.js <project_root>
 * Output: JSON to stdout.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', 'gen', 'dist', 'mta_archives', '.vscode']);

const RE = {
  service: /\bservice\s+([A-Za-z_][\w.]*)/g,
  entity: /\b(?:entity|view)\s+([A-Za-z_]\w*)/g,
  projection: /\bas\s+projection\s+on\b|\bas\s+select\b/,
  requires: /@requires\b/,
  restrict: /@\(?\s*restrict\b|@restrict\b/,
  readonly: /@readonly\b/,
  insertonly: /@insertonly\b/,
  composition: /\bComposition\s+of\b/g,
  association: /\bAssociation\s+to\b/g,
  unmanagedAssoc: /\bAssociation\s+to\s+[^\n;{]*\bon\b/g,
  assertIntegrity: /@assert\.integrity\b/g,
};

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

// remove /* */, // and leading-# comments so annotations in comments don't count
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/^\s*#.*$/gm, '');
}

function walk(root, exts) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...walk(path.join(root, entry.name), exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      out.push(path.join(root, entry.name));
    }
  }
  return out;
}

const rel = (root, p) => path.relative(root, p);
const countLines = (s) => s.split('\n').length;
const matchCount = (re, s) => (s.match(re) || []).length;

// find the body of a { } block given the index of the opening brace
function findBlock(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return text.slice(openIdx + 1, i); }
  }
  return text.slice(openIdx + 1);
}

// collect annotation lines immediately preceding position idx
function prefixAnnotations(text, idx) {
  const before = text.slice(0, idx);
  const lines = before.split('\n');
  // drop the partial line the keyword sits on
  lines.pop();
  const collected = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const s = lines[i].trim();
    if (s === '') continue;
    if (s.startsWith('@')) collected.push(s);
    else break;
  }
  return collected.join(' ');
}

/*
 * Parse each `service` block individually. Important subtlety: a @requires on
 * ONE service does not protect ANOTHER service in the same file. So we scope
 * annotations to each block (its prefix annotations + inline @(...) before {).
 */
function analyzeServiceFile(root, p) {
  const raw = read(p);
  const text = stripComments(raw);
  const services = [];

  for (const m of text.matchAll(RE.service)) {
    const name = m[1];
    const start = m.index;
    const nameEnd = start + m[0].length;
    const braceIdx = text.indexOf('{', nameEnd);
    const inline = braceIdx !== -1 ? text.slice(nameEnd, braceIdx) : '';
    const prefix = prefixAnnotations(text, start);
    const scope = prefix + ' ' + inline;
    const body = braceIdx !== -1 ? findBlock(text, braceIdx) : '';

    const protectedSvc = RE.requires.test(scope) || RE.restrict.test(scope);
    const entityNames = [...body.matchAll(RE.entity)].map((e) => e[1]);

    let entitiesWithAuth = 0;
    for (const em of body.matchAll(/\b(?:entity|view)\s+[A-Za-z_]\w*/g)) {
      const ePrefix = prefixAnnotations(body, em.index);
      const semi = body.indexOf(';', em.index + em[0].length);
      const eTail = body.slice(em.index + em[0].length, semi === -1 ? body.length : semi);
      if (RE.requires.test(ePrefix + eTail) || RE.restrict.test(ePrefix + eTail)) entitiesWithAuth++;
    }

    services.push({
      service: name,
      protected: protectedSvc,
      protection: { requires: RE.requires.test(scope), restrict: RE.restrict.test(scope) },
      entities: entityNames,
      entities_with_own_auth: entitiesWithAuth,
    });
  }

  return {
    file: rel(root, p),
    services,
    service_names: services.map((s) => s.service),
    entity_count: matchCount(RE.entity, text),
    has_readonly: RE.readonly.test(text),
    has_insertonly: RE.insertonly.test(text),
    exposes_projection: RE.projection.test(text),
    protected: services.length ? services.every((s) => s.protected) : true,
    lines: countLines(raw),
  };
}

function analyzeDbFile(root, p) {
  const raw = read(p);
  const text = stripComments(raw);
  return {
    file: rel(root, p),
    entities: [...text.matchAll(RE.entity)].map((e) => e[1]),
    compositions: matchCount(RE.composition, text),
    associations: matchCount(RE.association, text),
    unmanaged_associations: matchCount(RE.unmanagedAssoc, text),
    assert_integrity: matchCount(RE.assertIntegrity, text),
    uses_cuid: text.includes('cuid'),
    uses_managed: /\bmanaged\b/.test(text),
    uses_cds_common: raw.includes('@sap/cds/common'),
    lines: countLines(raw),
  };
}

function findAuthKind(root) {
  for (const cfg of ['package.json', '.cdsrc.json', '.cdsrc-private.json']) {
    const p = path.join(root, cfg);
    if (!fs.existsSync(p)) continue;
    let data;
    try { data = JSON.parse(read(p)); } catch { continue; }
    const cds = cfg === 'package.json' ? (data.cds || {}) : data;
    const auth = ((cds || {}).requires || {}).auth;
    if (typeof auth === 'string') return { source: cfg, kind: auth };
    if (auth && typeof auth === 'object') return { source: cfg, kind: auth.kind || 'unknown', config: auth };
  }
  return { source: null, kind: 'default (mocked in dev)' };
}

function main() {
  const root = path.resolve(process.argv[2] || '');
  if (!process.argv[2]) { console.log(JSON.stringify({ error: 'usage: node inventory.js <project_root>' })); process.exit(1); }

  const pkgPath = path.join(root, 'package.json');
  let pkg = {};
  if (fs.existsSync(pkgPath)) { try { pkg = JSON.parse(read(pkgPath)); } catch { pkg = {}; } }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const isCap = '@sap/cds' in deps || fs.existsSync(path.join(root, 'srv'));

  const keyFiles = {
    'xs-security.json': fs.existsSync(path.join(root, 'xs-security.json')),
    'mta.yaml': fs.existsSync(path.join(root, 'mta.yaml')),
    'package.json': fs.existsSync(pkgPath),
    '.cdsrc.json': fs.existsSync(path.join(root, '.cdsrc.json')),
    'xs-app.json': walk(root, ['.json']).some((p) => path.basename(p) === 'xs-app.json'),
  };

  const srvDir = path.join(root, 'srv');
  const dbDir = path.join(root, 'db');
  const serviceFiles = walk(fs.existsSync(srvDir) ? srvDir : root, ['.cds']).map((p) => analyzeServiceFile(root, p));
  const dbFiles = walk(fs.existsSync(dbDir) ? dbDir : root, ['.cds']).map((p) => analyzeDbFile(root, p));

  const handlerFiles = walk(fs.existsSync(srvDir) ? srvDir : root, ['.js', '.ts']).map((p) => {
    const raw = read(p);
    return { file: rel(root, p), lines: countLines(raw), handler_registrations: matchCount(/\.(?:on|before|after)\s*\(/g, raw) };
  });

  const unprotected = [];
  for (const sf of serviceFiles) {
    for (const svc of sf.services) {
      if (!svc.protected && svc.entities_with_own_auth < svc.entities.length) {
        unprotected.push({
          file: sf.file,
          service: svc.service,
          note: 'no service-level @requires/@restrict' +
            (svc.entities_with_own_auth === 0 ? '' : '; some but not all entities carry their own auth'),
        });
      }
    }
  }

  const result = {
    project_root: root,
    is_cap_project: isCap,
    cds_version: deps['@sap/cds'] || null,
    key_files: keyFiles,
    auth_kind: findAuthKind(root),
    counts: { service_cds_files: serviceFiles.length, db_cds_files: dbFiles.length, handler_files: handlerFiles.length },
    service_files: serviceFiles.sort((a, b) => b.lines - a.lines),
    db_files: dbFiles,
    handler_files: handlerFiles.sort((a, b) => b.lines - a.lines),
    flags: {
      xs_security_missing: !keyFiles['xs-security.json'],
      services_without_auth_annotation: unprotected,
      large_files: [...serviceFiles, ...handlerFiles].filter((f) => f.lines > 300).map((f) => f.file),
    },
  };
  console.log(JSON.stringify(result, null, 2));
}

main();