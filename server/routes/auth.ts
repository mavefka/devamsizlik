import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { rateLimit } from 'express-rate-limit';
import { db } from '../db';
import { signToken, authMiddleware, type AuthenticatedRequest } from '../auth';

const router = Router();

// Rate limiter for authentication endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // max 30 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' },
});

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Strict MIME to extension mapping
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// Multer configuration: derive extension strictly from verified MIME type, never from user originalname
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: AuthenticatedRequest, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.png';
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const filename = `${req.user?.id || 'anon'}-${Date.now()}-${randomSuffix}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (Object.keys(MIME_TO_EXT).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Yalnızca resim dosyaları yüklenebilir (JPG, PNG, WEBP, GIF)'));
    }
  },
});

// Register
router.post('/register', authLimiter, async (req, res: Response) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
      res.status(400).json({ error: 'Kullanıcı adı 3 ile 30 karakter arasında olmalıdır.' });
      return;
    }

    const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
    if (!USERNAME_REGEX.test(username.trim())) {
      res.status(400).json({ error: 'Kullanıcı adı yalnızca harf, rakam, nokta, alt çizgi ve tire içerebilir.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Şifre en az 6, en fazla 128 karakter olmalıdır.' });
      return;
    }

    if (displayName && (typeof displayName !== 'string' || displayName.trim().length > 50)) {
      res.status(400).json({ error: 'Görünen isim en fazla 50 karakter olabilir.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = (displayName && typeof displayName === 'string') ? displayName.trim() : username.trim();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existing) {
      res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, cleanUsername, passwordHash, cleanDisplayName, null, now);

    const token = signToken({ id: userId, username: cleanUsername });

    res.status(201).json({
      token,
      user: {
        id: userId,
        username: cleanUsername,
        displayName: cleanDisplayName,
        avatarUrl: null,
        createdAt: now,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
      return;
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername) as any;

    if (!user) {
      res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
      return;
    }

    const token = signToken({ id: user.id, username: user.username });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Profil bilgisi alınamadı.' });
  }
});

// Upload profile avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Dosya yüklenemedi.' });
      return;
    }

    // Delete user's previous avatar if it exists
    const currentUser = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(req.user!.id) as any;
    if (currentUser?.avatar_url && typeof currentUser.avatar_url === 'string' && currentUser.avatar_url.startsWith('/uploads/avatars/')) {
      const oldAvatarPath = path.join(process.cwd(), currentUser.avatar_url.replace(/^\//, ''));
      if (fs.existsSync(oldAvatarPath)) {
        try {
          fs.unlinkSync(oldAvatarPath);
        } catch (unlinkErr) {
          console.error('Failed to unlink old avatar:', unlinkErr);
        }
      }
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user!.id);

    res.json({ avatarUrl });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: err.message || 'Profil resmi yüklenirken hata oluştu.' });
  }
});

// Update display name
router.put('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { displayName } = req.body;
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.trim().length > 50) {
      res.status(400).json({ error: 'Görünen isim 1 ile 50 karakter arasında olmalıdır.' });
      return;
    }

    const clean = displayName.trim();
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(clean, req.user!.id);

    res.json({ displayName: clean });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profil güncellenemedi.' });
  }
});

// Delete account (requires entering password twice)
router.post('/delete-account', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      res.status(400).json({ error: 'Hesabınızı silmek için şifrenizi iki kez girmeniz gerekmektedir.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Girdiğiniz şifreler birbiriyle eşleşmiyor.' });
      return;
    }

    const userId = req.user!.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Şifreniz hatalı. Hesap silinemedi.' });
      return;
    }

    // If user has a local avatar, delete it
    if (user.avatar_url && typeof user.avatar_url === 'string' && user.avatar_url.startsWith('/uploads/avatars/')) {
      const avatarPath = path.join(process.cwd(), user.avatar_url.replace(/^\//, ''));
      if (fs.existsSync(avatarPath)) {
        try {
          fs.unlinkSync(avatarPath);
        } catch (unlinkErr) {
          console.error('Avatar file removal error:', unlinkErr);
        }
      }
    }

    // Delete user and user data within a transaction
    const deleteTx = db.transaction(() => {
      db.prepare('DELETE FROM user_data WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });
    deleteTx();

    res.json({ success: true, message: 'Hesabınız ve tüm verileriniz kalıcı olarak silindi.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Hesap silinirken bir hata oluştu.' });
  }
});

export default router;
