import express from 'express';
import bcrypt from 'bcryptjs';
import db, { requestFromRow } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

function rolesToJson(roles) {
  const arr = Array.isArray(roles) ? roles.filter((r) => r === 'student' || r === 'teacher') : [];
  return JSON.stringify(arr.length ? [...new Set(arr)] : ['student']);
}

// Подача заявки на регистрацию (без авторизации). Студент / преподаватель / оба.
router.post('/register', async (req, res) => {
  const { password, group, facts, photoConsent, groupComment, roles, ...rest } = req.body;
  const rolesArr = Array.isArray(roles) && roles.length ? roles : ['student'];
  const isTeacherOnly = rolesArr.length === 1 && rolesArr[0] === 'teacher';

  if (!rest.name || !rest.graduationYear || (!isTeacherOnly && !group)) {
    return res.status(400).json({
      error: isTeacherOnly
        ? 'Заполните обязательные поля: ФИО, год'
        : 'Заполните обязательные поля: ФИО, группа, год выпуска',
    });
  }
  if (!password) {
    return res.status(400).json({ error: 'Пароль обязателен' });
  }

  const existingRequest = db.prepare(
    "SELECT id FROM requests WHERE name=? AND type='registration' AND status IN ('pending','approved')"
  ).get(rest.name);
  if (existingRequest) {
    return res.status(409).json({ error: 'Заявка на регистрацию с таким именем уже существует или была одобрена' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE login=?').get(rest.name);
  if (existingUser) {
    return res.status(409).json({ error: 'Пользователь с таким именем уже зарегистрирован в системе' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  db.prepare(`
    INSERT INTO requests
      (type, status, createdAt, name, photo, photoConsent, grp, groupComment, graduationYear, job, gender, facts, roles, passwordHash, passwordPlain, message)
    VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'registration',
    new Date().toISOString(),
    rest.name,
    rest.photo || null,
    photoConsent ? 1 : 0,
    isTeacherOnly ? '' : group,
    groupComment || null,
    rest.graduationYear,
    rest.job || '',
    rest.gender || 'Мужской',
    JSON.stringify(facts || []),
    rolesToJson(rolesArr),
    passwordHash,
    password,
    rest.message || ''
  );

  res.status(201).json({ success: true });
});

// Подача заявки на удаление аккаунта (требует авторизации)
router.post('/deletion', authenticate, (req, res) => {
  db.prepare(`
    INSERT INTO requests (type, status, createdAt, submittedBy, graduateId, name, message)
    VALUES (?, 'pending', ?, ?, ?, ?, ?)
  `).run(
    'deletion',
    new Date().toISOString(),
    req.user.id,
    req.user.graduateId || null,
    req.user.login,
    req.body.message || ''
  );

  res.status(201).json({ success: true });
});

// Удалить заявку (только admin)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const request = db.prepare('SELECT id FROM requests WHERE id = ?').get(id);
  if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
  db.prepare('DELETE FROM requests WHERE id = ?').run(id);
  res.json({ success: true });
});

// Список заявок (только admin)
router.get('/', authenticate, requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM requests ORDER BY createdAt DESC').all();
  res.json(rows.map(requestFromRow));
});

// Одобрить/отклонить заявку (только admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
  if (!request) return res.status(404).json({ error: 'Заявка не найдена' });

  if (request.status !== 'pending') {
    return res.status(409).json({ error: 'Заявка уже обработана', status: request.status });
  }

  const { status } = req.body;
  const resolvedAt = new Date().toISOString();

  try {
    db.transaction(() => {
      db.prepare('UPDATE requests SET status=?, resolvedAt=? WHERE id=?').run(status, resolvedAt, id);

      if (status === 'approved') {
        if (request.type === 'registration') {
          const info = db.prepare(`
            INSERT INTO graduates (name, photo, photoConsent, grp, graduationYear, job, gender, facts, roles)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            request.name,
            request.photo || null,
            request.photoConsent ?? 0,
            request.grp || '',
            request.graduationYear,
            request.job || '',
            request.gender || 'Мужской',
            request.facts || '[]',
            request.roles || '["student"]'
          );
          const newGradId = info.lastInsertRowid;
          db.prepare('UPDATE requests SET graduateId=? WHERE id=?').run(newGradId, id);

          if (request.name && request.passwordHash) {
            db.prepare('INSERT INTO users (login, password, role, graduateId) VALUES (?, ?, ?, ?)')
              .run(request.name, request.passwordHash, 'member', newGradId);
          }
        }

        if (request.type === 'deletion' && request.graduateId) {
          db.prepare('DELETE FROM users WHERE graduateId=?').run(request.graduateId);
          db.prepare('DELETE FROM graduates WHERE id=?').run(request.graduateId);
        }
      }
    })();
  } catch (err) {
    console.error('Ошибка при обработке заявки:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера при обработке заявки' });
  }

  const updated = db.prepare('SELECT * FROM requests WHERE id=?').get(id);
  res.json(requestFromRow(updated));
});

export default router;
