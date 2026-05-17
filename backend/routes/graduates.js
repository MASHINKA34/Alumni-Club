import express from 'express';
import bcrypt from 'bcryptjs';
import db, { gradFromRow } from '../db.js';
import { optionalAuthenticate, authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const WITH_USER = `
  SELECT g.*, u.login AS userLogin, u.id AS userId
  FROM graduates g
  LEFT JOIN users u ON u.graduateId = g.id
`;

function rolesToJson(roles) {
  const arr = Array.isArray(roles) ? roles.filter((r) => r === 'student' || r === 'teacher') : [];
  return JSON.stringify(arr.length ? [...new Set(arr)] : ['student']);
}

function serialize(row, isAuth) {
  return {
    ...gradFromRow(row),
    photo: isAuth ? (row.photo || null) : null,
    userLogin: row.userLogin || '',
    userId: row.userId || null,
  };
}

// Список. Фото передаётся только авторизованным.
router.get('/', optionalAuthenticate, (req, res) => {
  const rows = db.prepare(`${WITH_USER} ORDER BY g.id`).all();
  const isAuth = !!req.user;
  res.json(rows.map((row) => serialize(row, isAuth)));
});

// Редактирование собственного профиля участником
router.put('/me', authenticate, async (req, res) => {
  if (!req.user.graduateId) {
    return res.status(404).json({ error: 'Профиль выпускника не привязан к аккаунту' });
  }
  const id = req.user.graduateId;
  const existing = db.prepare('SELECT * FROM graduates WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Выпускник не найден' });

  const { group, facts, photoConsent, roles, ...rest } = req.body;
  const name = (rest.name ?? existing.name)?.trim();
  if (!name) return res.status(400).json({ error: 'ФИО не может быть пустым' });

  const nextRoles = roles !== undefined ? rolesToJson(roles) : existing.roles;
  const isTeacherOnly = nextRoles === '["teacher"]';

  db.prepare(`
    UPDATE graduates
    SET name=?, photo=?, photoConsent=?, grp=?, graduationYear=?, job=?, gender=?, facts=?, roles=?
    WHERE id=?
  `).run(
    name,
    rest.photo !== undefined ? (rest.photo || null) : existing.photo,
    photoConsent !== undefined ? (photoConsent ? 1 : 0) : existing.photoConsent,
    isTeacherOnly ? (group ?? '') : (group || existing.grp),
    rest.graduationYear ?? existing.graduationYear,
    rest.job ?? existing.job,
    rest.gender ?? existing.gender,
    facts ? JSON.stringify(facts) : existing.facts,
    nextRoles,
    id
  );

  // Логин синхронизируется с ФИО (логин = ФИО, как при регистрации)
  if (name !== existing.name) {
    const clash = db.prepare('SELECT id FROM users WHERE login=? AND id<>?').get(name, req.user.id);
    if (!clash) db.prepare('UPDATE users SET login=? WHERE id=?').run(name, req.user.id);
  }

  const row = db.prepare(`${WITH_USER} WHERE g.id = ?`).get(id);
  res.json(serialize(row, true));
});

// Один выпускник. Фото — только авторизованным.
router.get('/:id', optionalAuthenticate, (req, res) => {
  const row = db.prepare(`${WITH_USER} WHERE g.id = ?`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Выпускник не найден' });
  res.json(serialize(row, !!req.user));
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { userLogin, login, password, group, facts, photoConsent, roles, ...rest } = req.body;
  const effectiveLogin = userLogin || login;

  const info = db.prepare(`
    INSERT INTO graduates (name, photo, photoConsent, grp, graduationYear, job, gender, facts, roles)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rest.name,
    rest.photo || null,
    photoConsent ? 1 : 0,
    group || '',
    rest.graduationYear,
    rest.job || '',
    rest.gender || 'Мужской',
    JSON.stringify(facts || []),
    rolesToJson(roles)
  );
  const newId = info.lastInsertRowid;

  if (effectiveLogin && password) {
    const hashed = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (login, password, role, graduateId) VALUES (?, ?, ?, ?)')
      .run(effectiveLogin, hashed, 'member', newId);
  }

  const row = db.prepare(`${WITH_USER} WHERE g.id = ?`).get(newId);
  res.status(201).json(serialize(row, true));
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM graduates WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Выпускник не найден' });

  const { userLogin, login, password, group, facts, photoConsent, roles, ...rest } = req.body;
  const effectiveLogin = userLogin || login;

  db.prepare(`
    UPDATE graduates
    SET name=?, photo=?, photoConsent=?, grp=?, graduationYear=?, job=?, gender=?, facts=?, roles=?
    WHERE id=?
  `).run(
    rest.name ?? existing.name,
    rest.photo ?? existing.photo,
    photoConsent !== undefined ? (photoConsent ? 1 : 0) : existing.photoConsent,
    group !== undefined ? group : existing.grp,
    rest.graduationYear ?? existing.graduationYear,
    rest.job ?? existing.job,
    rest.gender ?? existing.gender,
    facts ? JSON.stringify(facts) : existing.facts,
    roles !== undefined ? rolesToJson(roles) : existing.roles,
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
  res.json(serialize(row, true));
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
