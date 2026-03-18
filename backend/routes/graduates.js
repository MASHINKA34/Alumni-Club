import express from 'express';
import bcrypt from 'bcryptjs';
import { readData, writeData } from '../utils/data.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Вернуть список выпускников (с логином из users.json для формы администратора)
router.get('/', (_req, res) => {
  const graduates = readData('graduates.json');
  const users = readData('users.json');
  const result = graduates.map((grad) => {
    const user = users.find((u) => u.graduateId === grad.id);
    return { ...grad, userLogin: user?.login || '' };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const graduates = readData('graduates.json');
  const users = readData('users.json');
  const grad = graduates.find((g) => g.id === Number(req.params.id));
  if (!grad) return res.status(404).json({ error: 'Выпускник не найден' });
  const user = users.find((u) => u.graduateId === grad.id);
  res.json({ ...grad, userLogin: user?.login || '' });
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const graduates = readData('graduates.json');
  const { login, password, userLogin, ...gradData } = req.body;
  const newGrad = { id: Date.now(), ...gradData };
  graduates.push(newGrad);
  writeData('graduates.json', graduates);

  const effectiveLogin = login || userLogin;
  if (effectiveLogin && password) {
    const users = readData('users.json');
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({
      id: Date.now() + 1,
      login: effectiveLogin,
      password: hashedPassword,
      role: 'member',
      graduateId: newGrad.id,
    });
    writeData('users.json', users);
  }

  res.status(201).json({ ...newGrad, userLogin: effectiveLogin || '' });
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const graduates = readData('graduates.json');
  const idx = graduates.findIndex((g) => g.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Выпускник не найден' });

  const { login, password, userLogin, ...gradData } = req.body;
  graduates[idx] = { ...graduates[idx], ...gradData, id: graduates[idx].id };
  writeData('graduates.json', graduates);

  const effectiveLogin = login || userLogin;
  const users = readData('users.json');
  const userIdx = users.findIndex((u) => u.graduateId === graduates[idx].id);

  if (effectiveLogin) {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      if (userIdx !== -1) {
        users[userIdx] = { ...users[userIdx], login: effectiveLogin, password: hashedPassword };
      } else {
        users.push({
          id: Date.now() + 1,
          login: effectiveLogin,
          password: hashedPassword,
          role: 'member',
          graduateId: graduates[idx].id,
        });
      }
    } else if (userIdx !== -1) {
      users[userIdx].login = effectiveLogin;
    }
    writeData('users.json', users);
  } else if (gradData.name && userIdx !== -1) {
    // Имя изменилось — автоматически обновляем логин
    users[userIdx].login = gradData.name;
    writeData('users.json', users);
  }

  const updatedUsers = readData('users.json');
  const linkedUser = updatedUsers.find((u) => u.graduateId === graduates[idx].id);
  res.json({ ...graduates[idx], userLogin: linkedUser?.login || '' });
});

router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const graduates = readData('graduates.json');
  const filtered = graduates.filter((g) => g.id !== Number(req.params.id));
  writeData('graduates.json', filtered);

  const users = readData('users.json');
  const filteredUsers = users.filter((u) => u.graduateId !== Number(req.params.id));
  writeData('users.json', filteredUsers);

  res.json({ success: true });
});

export default router;
