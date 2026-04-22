import express from 'express';
import bcrypt from 'bcryptjs';
import db, { gradFromRow } from '../db.js';
import { optionalAuthenticate, authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const WITH_USER = `
  SELECT g.*, u.login AS userLogin
  FROM graduates g
  LEFT JOIN users u ON u.graduateId = g.id
`;

// Список. Фото передаётся только авторизованным.
router.get('/', optionalAuthenticate, (req, res) => {
  const rows = db.prepare(`${WITH_USER} ORDER BY g.id`).all();
  const isAuth = !!req.user;
  res.json(rows.map((row) => ({
    ...gradFromRow(row),
    photo: isAuth ? (row.photo || null) : null,
    userLogin: row.userLogin || '',
  })));
});

// Один выпускник. Фото — только авторизованным.
router.get('/:id', optionalAuthenticate, (req, res) => {
  const row = db.prepare(`${WITH_USER} WHERE g.id = ?`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Выпускник не найден' });
  res.json({
    ...gradFromRow(row),
    photo: req.user ? (row.photo || null) : null,
    userLogin: row.userLogin || '',
  });
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { userLogin, login, password, group, facts, photoConsent, ...rest } = req.body;
  const effectiveLogin = userLogin || login;

  const info = db.prepare(`
    INSERT INTO graduates (name, photo, photoConsent, grp, graduationYear, job, gender, facts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rest.name,
    rest.photo || null,
    photoConsent ? 1 : 0,
    group || '',
    rest.graduationYear,
    rest.job || '',
    rest.gender || 'Мужской',
    JSON.stringify(facts || [])
  );
  const newId = info.lastInsertRowid;

  if (effectiveLogin && password) {
    const hashed = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (login, password, role, graduateId) VALUES (?, ?, ?, ?)')
      .run(effectiveLogin, hashed, 'member', newId);
  }

  const row = db.prepare(`${WITH_USER} WHERE g.id = ?`).get(newId);
  res.status(201).json({ ...gradFromRow(row), userLogin: row?.userLogin || '' });
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM graduates WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Выпускник не найден' });

  const { userLogin, login, password, group, facts, photoConsent, ...rest } = req.body;
  const effectiveLogin = userLogin || login;

  db.prepare(`
    UPDATE graduates
    SET name=?, photo=?, photoConsent=?, grp=?, graduationYear=?, job=?, gender=?, facts=?
    WHERE id=?
  `).run(
    rest.name ?? existing.name,
    rest.photo ?? existing.photo,
    photoConsent !== undefined ? (photoConsent ? 1 : 0) : existing.photoConsent,
    group || existing.grp,
    rest.graduationYear ?? existing.graduationYear,
    rest.job ?? existing.job,
    rest.gender ?? existing.gender,
    facts ? JSON.stringify(facts) : existing.facts,
    id
  );

  const user = db.prepare('SELECT * FROM users WHERE graduateId = ?').get(id);

  if (effectiveLogin) {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      if (user) {
        db.prepare('UPDATE users SET login=?, password=? WHERE id=?').run(effectiveLogin, hashed, user.id);
      } else {
        db.prepare('INSERT INTO users (login, password, role, graduateId) VALUES (?, ?, ?, ?)')
          .run(effectiveLogin, hashed, 'member', id);
      }
    } else if (user) {
      db.prepare('UPDATE users SET login=? WHERE id=?').run(effectiveLogin, user.id);
    }
  } else if (rest.name && user) {
    // Имя изменилось — логин синхронизируется автоматически
    db.prepare('UPDATE users SET login=? WHERE id=?').run(rest.name, user.id);
  }

  const row = db.prepare(`${WITH_USER} WHERE g.id = ?`).get(id);
  res.json({ ...gradFromRow(row), userLogin: row?.userLogin || '' });
});

router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.transaction(() => {
    db.prepare('DELETE FROM users WHERE graduateId = ?').run(id);
    db.prepare('DELETE FROM graduates WHERE id = ?').run(id);
  })();
  res.json({ success: true });
});

export default router;
