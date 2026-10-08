// srv/lib/dev-auth.ts
// DEV-ONLY cookie-session authentication. Validates credentials against the
// mocked users in cds.requires.auth.users and resolves a session cookie to a
// CAP user, so @restrict/@requires keep doing the real authorization.
// Never active in production: it is only configured in the [development]
// profile (.cdsrc.json) and server.ts refuses to mount the login routes
// when NODE_ENV=production. In production, use XSUAA/IAS via an approuter.
import cds from '@sap/cds';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const COOKIE = 'travellers_sid';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

interface Session { id: string; roles: string[]; expires: number }
const sessions = new Map<string, Session>();

type MockedUsers = Record<string, { password?: string; roles?: string[] }>;

const safeEqual = (a: string, b: string): boolean => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const readSid = (req: Request): string | undefined =>
  req.headers.cookie?.split(';').map(c => c.trim().split('='))
    .find(([k]) => k === COOKIE)?.[1];

const sessionOf = (req: Request): Session | undefined => {
  const sid = readSid(req);
  const s = sid ? sessions.get(sid) : undefined;
  if (s && s.expires < Date.now()) { sessions.delete(sid!); return undefined; }
  return s;
};

/** Returns the session id on success, undefined for bad credentials. */
export function login(id: string, password: string): string | undefined {
  const users = ((cds.env.requires as any)?.auth?.users ?? {}) as MockedUsers;
  const u = Object.hasOwn(users, id) ? users[id] : undefined;
  // users without a configured password cannot log in through the form
  if (!u?.password || !safeEqual(password, u.password)) return undefined;
  const sid = randomBytes(32).toString('hex');
  sessions.set(sid, { id, roles: u.roles ?? [], expires: Date.now() + SESSION_TTL_MS });
  return sid;
}

export const logout = (req: Request): void => {
  const sid = readSid(req);
  if (sid) sessions.delete(sid);
};

export const currentUser = (req: Request) => sessionOf(req);

/** CAP auth middleware: session cookie -> cds.User; otherwise anonymous (CAP answers 401). */
export default function devAuth() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const s = sessionOf(req);
    if (s) {
      const user = new cds.User({ id: s.id, attr: {}, roles: s.roles });
      (cds.context as any).user = (req as any).user = user;
    }
    next();
  };
}
