import express from 'express';
import bcrypt from 'bcryptjs';
import { readData, writeData } from '../utils/data.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Подача заявки на регистрацию (без авторизации)
router.post('/register', (req, res) => {
  const requests = readData('requests.json');
  const newRequest = {
    id: Date.now(),
    type: 'registration',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  requests.push(newRequest);
  writeData('requests.json', requests);
  res.status(201).json({ success: true });
});

// Подача заявки на редактирование (требует авторизации)
router.post('/edit', authenticate, (req, res) => {
  const requests = readData('requests.json');
  const newRequest = {
    id: Date.now(),
    type: 'edit',
    status: 'pending',
    createdAt: new Date().toISOString(),
    submittedBy: req.user.id,
    graduateId: req.user.graduateId || req.body.graduateId || null,
    ...req.body,
  };
  requests.push(newRequest);
  writeData('requests.json', requests);
  res.status(201).json({ success: true });
});

// Список заявок (только admin)
router.get('/', authenticate, requireAdmin, (_req, res) => {
  res.json(readData('requests.json'));
});

// Одобрить/отклонить заявку (только admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const requests = readData('requests.json');
  const idx = requests.findIndex((r) => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Заявка не найдена' });

  const { status } = req.body;
  requests[idx].status = status;
  requests[idx].resolvedAt = new Date().toISOString();

  if (status === 'approved') {
    if (requests[idx].type === 'registration') {
      const graduates = readData('graduates.json');
      const newGrad = {
        id: Date.now(),
        name: requests[idx].name,
        photo: requests[idx].photo || null,
        photoConsent: requests[idx].photoConsent ?? false,
        group: requests[idx].group,
        graduationYear: requests[idx].graduationYear,
        job: requests[idx].job || '',
        gender: requests[idx].gender || 'Мужской',
        facts: requests[idx].facts || [],
      };
      graduates.push(newGrad);
      writeData('graduates.json', graduates);
      requests[idx].graduateId = newGrad.id;

      // Создать аккаунт пользователя: логин = ФИО, пароль из заявки
      const reqLogin = requests[idx].name;
      const reqPassword = requests[idx].password;
      if (reqLogin && reqPassword) {
        const users = readData('users.json');
        const hashedPassword = await bcrypt.hash(reqPassword, 10);
        users.push({
          id: Date.now() + 1,
          login: reqLogin,
          password: hashedPassword,
          role: 'member',
          graduateId: newGrad.id,
        });
        writeData('users.json', users);
      }
    }

    if (requests[idx].type === 'edit' && requests[idx].graduateId) {
      const graduates = readData('graduates.json');
      const gIdx = graduates.findIndex((g) => g.id === requests[idx].graduateId);
      if (gIdx !== -1) {
        const { id, type, status: _s, createdAt, submittedBy, resolvedAt, password, login, ...changes } = requests[idx];
        graduates[gIdx] = { ...graduates[gIdx], ...changes };
        writeData('graduates.json', graduates);

        // Если имя изменилось — обновляем логин пользователя
        if (changes.name) {
          const users = readData('users.json');
          const uIdx = users.findIndex((u) => u.graduateId === requests[idx].graduateId);
          if (uIdx !== -1) {
            users[uIdx].login = changes.name;
            writeData('users.json', users);
          }
        }
      }
    }
  }

  writeData('requests.json', requests);
  res.json(requests[idx]);
});

export default router;
