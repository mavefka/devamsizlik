import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET ortam değişkeni ayarlanmamış! Üretim ortamında JWT_SECRET zorunludur.');
  }
  console.warn('⚠️ UYARI: JWT_SECRET tanımlanmadı. Geliştirme ortamı için geçici anahtar kullanılıyor.');
  return 'devamsizlik-takip-dev-secret-key-change-in-production';
}

const JWT_SECRET = getJwtSecret();

export interface UserPayload {
  id: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum' });
    return;
  }

  req.user = payload;
  next();
}
