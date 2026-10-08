// srv/server.ts
// DEV-ONLY login endpoints for the Travellers app login screen.
// Not mounted in production (use XSUAA/IAS through an approuter there).
import cds from '@sap/cds';
import express from 'express';
import { COOKIE, currentUser, login, logout } from './lib/dev-auth';

const MAX_FAILURES = 5;
const WINDOW_MS = 60_000;
const failures = new Map<string, { count: number; since: number }>();

const blocked = (ip: string): boolean => {
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() - f.since > WINDOW_MS) { failures.delete(ip); return false; }
  return f.count >= MAX_FAILURES;
};

cds.on('bootstrap', (app: express.Application) => {
  if (process.env.NODE_ENV === 'production') return;

  const cookie = (value: string, maxAge: number) =>
    `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;

  app.post('/login', express.json({ limit: '1kb' }), (req, res) => {
    const ip = req.ip ?? 'unknown';
    if (blocked(ip)) return void res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });

    const { userId, password } = req.body ?? {};
    const sid = typeof userId === 'string' && typeof password === 'string'
      ? login(userId, password) : undefined;
    if (!sid) {
      const f = failures.get(ip) ?? { count: 0, since: Date.now() };
      failures.set(ip, { count: f.count + 1, since: f.since });
      return void res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    failures.delete(ip);
    res.setHeader('Set-Cookie', cookie(sid, 8 * 60 * 60));
    res.json({ id: userId });
  });

  app.post('/logout', (req, res) => {
    logout(req);
    res.setHeader('Set-Cookie', cookie('', 0));
    res.sendStatus(204);
  });

  app.get('/me', (req, res) => {
    const s = currentUser(req);
    if (!s) return void res.sendStatus(401);
    res.json({ id: s.id, roles: s.roles });
  });
});

export default cds.server;
