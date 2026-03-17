import express from 'express';
import { readData, writeData } from '../utils/data.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(readData('groups.json'));
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Укажите название группы' });
  const groups = readData('groups.json');
  if (groups.includes(name.trim())) return res.status(400).json({ error: 'Группа уже существует' });
  groups.push(name.trim());
  writeData('groups.json', groups);
  res.status(201).json(groups);
});

router.delete('/:name', authenticate, requireAdmin, (req, res) => {
  const groups = readData('groups.json');
  const filtered = groups.filter((g) => g !== req.params.name);
  writeData('groups.json', filtered);
  res.json({ success: true });
});

export default router;
