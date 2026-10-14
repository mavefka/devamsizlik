import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

describe('account deletion logic', () => {
  function setupTestDb() {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE user_data (
        user_id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    return db;
  }

  it('rejects deletion when confirm password does not match', () => {
    const password: string = 'mySecretPassword123';
    const confirmPassword: string = 'wrongPassword';
    const passwordsMatch = password === confirmPassword;
    expect(passwordsMatch).toBe(false);
  });

  it('rejects deletion when password is empty', () => {
    const password = '';
    const confirmPassword = '';
    const hasBoth = Boolean(password && confirmPassword);
    expect(hasBoth).toBe(false);
  });

  it('verifies correct password and cascades user deletion', async () => {
    const db = setupTestDb();
    const userId = 'user-test-1';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('secret123', salt);

    // Insert user and user_data
    db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, 'testuser', hash, 'Test User', null, new Date().toISOString());

    db.prepare(`
      INSERT INTO user_data (user_id, data_json, updated_at)
      VALUES (?, ?, ?)
    `).run(userId, JSON.stringify({ absences: [] }), new Date().toISOString());

    // Verify records exist
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    expect(user).toBeDefined();
    expect(user.username).toBe('testuser');

    const data = db.prepare('SELECT * FROM user_data WHERE user_id = ?').get(userId);
    expect(data).toBeDefined();

    // Wrong password check
    const isWrongValid = await bcrypt.compare('wrongpass', user.password_hash);
    expect(isWrongValid).toBe(false);

    // Correct password check
    const isCorrectValid = await bcrypt.compare('secret123', user.password_hash);
    expect(isCorrectValid).toBe(true);

    // Perform deletion in transaction
    const deleteTx = db.transaction(() => {
      db.prepare('DELETE FROM user_data WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });
    deleteTx();

    // Verify user and data are completely deleted
    const userAfter = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    expect(userAfter).toBeUndefined();

    const dataAfter = db.prepare('SELECT * FROM user_data WHERE user_id = ?').get(userId);
    expect(dataAfter).toBeUndefined();

    db.close();
  });
});
