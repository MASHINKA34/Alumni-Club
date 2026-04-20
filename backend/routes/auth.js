import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Введите логин и пароль' });

  const user = db.prepare('SELECT * FROM users WHERE login = ?').get(login);
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Неверный логин или пароль' });

  const token = jwt.sign(
    { id: user.id, login: user.login, role: user.role, graduateId: user.graduateId ?? null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, role: user.role, graduateId: user.graduateId ?? null, login: user.login });
});

export default router;
