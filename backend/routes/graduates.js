import express from 'express';
import { readData, writeData } from '../utils/data.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(readData('graduates.json'));
});

router.get('/:id', (req, res) => {
  const graduates = readData('graduates.json');
  const grad = graduates.find((g) => g.id === Number(req.params.id));
  if (!grad) return res.status(404).json({ error: 'Выпускник не найден' });
  res.json(grad);
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  const graduates = readData('graduates.json');
  const newGrad = { id: Date.now(), ...req.body };
  graduates.push(newGrad);
  writeData('graduates.json', graduates);
  res.status(201).json(newGrad);
});

router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const graduates = readData('graduates.json');
  const idx = graduates.findIndex((g) => g.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Выпускник не найден' });
  graduates[idx] = { ...graduates[idx], ...req.body, id: graduates[idx].id };
  writeData('graduates.json', graduates);
  res.json(graduates[idx]);
});

router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const graduates = readData('graduates.json');
  const filtered = graduates.filter((g) => g.id !== Number(req.params.id));
  writeData('graduates.json', filtered);
  res.json({ success: true });
});

export default router;
