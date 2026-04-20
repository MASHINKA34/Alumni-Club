import express from 'express';
import bcrypt from 'bcryptjs';
import db, { gradFromRow, requestFromRow } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Подача заявки на регистрацию (без авторизации)
router.post('/register', async (req, res) => {
  const { password, group, facts, photoConsent, groupComment, ...rest } = req.body;
  if (!rest.name || !group || !rest.graduationYear) {
    return res.status(400).json({ error: 'Заполните обязательные поля: ФИО, группа, год выпуска' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Пароль обязателен' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  db.prepare(`
    INSERT INTO requests
      (type, status, createdAt, name, photo, photoConsent, grp, groupComment, graduationYear, job, gender, facts, passwordHash, message)
    VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'registration',
    new Date().toISOString(),
    rest.name,
    rest.photo || null,
    photoConsent ? 1 : 0,
    group,
    groupComment || null,
    rest.graduationYear,
    rest.job || '',
    rest.gender || 'Мужской',
    JSON.stringify(facts || []),
    passwordHash,
    rest.message || ''
  );

  res.status(201).json({ success: true });
});

// Подача заявки на редактирование (требует авторизации)
router.post('/edit', authenticate, (req, res) => {
  const { group, facts, photoConsent, groupComment, ...rest } = req.body;

  db.prepare(`
    INSERT INTO requests
      (type, status, createdAt, submittedBy, graduateId, name, photo, photoConsent, grp, groupComment,
       graduationYear, job, gender, facts, message)
    VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'edit',
    new Date().toISOString(),
    req.user.id,
    req.user.graduateId || rest.graduateId || null,
    rest.name || null,
    rest.photo || null,
    photoConsent ? 1 : 0,
    group || '',
    groupComment || null,
    rest.graduationYear || null,
    rest.job || '',
    rest.gender || 'Мужской',
    JSON.stringify(facts || []),
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

  const { status } = req.body;
  const resolvedAt = new Date().toISOString();

  db.prepare('UPDATE requests SET status=?, resolvedAt=? WHERE id=?').run(status, resolvedAt, id);

  if (status === 'approved') {
    if (request.type === 'registration') {
      const info = db.prepare(`
        INSERT INTO graduates (name, photo, photoConsent, grp, graduationYear, job, gender, facts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        request.name,
        request.photo || null,
        request.photoConsent ?? 0,
        request.grp || '',
        request.graduationYear,
        request.job || '',
        request.gender || 'Мужской',
        request.facts || '[]'
      );
      const newGradId = info.lastInsertRowid;
      db.prepare('UPDATE requests SET graduateId=? WHERE id=?').run(newGradId, id);

      if (request.name && request.passwordHash) {
        db.prepare('INSERT INTO users (login, password, role, graduateId) VALUES (?, ?, ?, ?)')
          .run(request.name, request.passwordHash, 'member', newGradId);
      }
    }

    if (request.type === 'edit' && request.graduateId) {
      const existing = db.prepare('SELECT * FROM graduates WHERE id = ?').get(request.graduateId);
      if (existing) {
        db.prepare(`
          UPDATE graduates
          SET name=?, photo=?, photoConsent=?, grp=?, graduationYear=?, job=?, gender=?, facts=?
          WHERE id=?
        `).run(
          request.name ?? existing.name,
          request.photo ?? existing.photo,
          request.photoConsent ?? existing.photoConsent,
          request.grp ?? existing.grp,
          request.graduationYear ?? existing.graduationYear,
          request.job ?? existing.job,
          request.gender ?? existing.gender,
          request.facts ?? existing.facts,
          request.graduateId
        );

        if (request.name) {
          db.prepare('UPDATE users SET login=? WHERE graduateId=?').run(request.name, request.graduateId);
        }
      }
    }

    if (request.type === 'deletion' && request.graduateId) {
      db.transaction(() => {
        db.prepare('DELETE FROM users WHERE graduateId=?').run(request.graduateId);
        db.prepare('DELETE FROM graduates WHERE id=?').run(request.graduateId);
      })();
    }
  }

  const updated = db.prepare('SELECT * FROM requests WHERE id=?').get(id);
  res.json(requestFromRow(updated));
});

export default router;
