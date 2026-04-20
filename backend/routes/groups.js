import express from 'express';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT name FROM groups_list ORDER BY name').all();
  res.json(rows.map((r) => r.name));
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Укажите название группы' });

  const exists = db.prepare('SELECT 1 FROM groups_list WHERE name = ?').get(name.trim());
  if (exists) return res.status(400).json({ error: 'Группа уже существует' });

  db.prepare('INSERT INTO groups_list (name) VALUES (?)').run(name.trim());
  const rows = db.prepare('SELECT name FROM groups_list ORDER BY name').all();
  res.status(201).json(rows.map((r) => r.name));
});

router.delete('/:name', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM groups_list WHERE name = ?').run(req.params.name);
  res.json({ success: true });
});

export default router;
