import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db from './db.js';
import authRoutes from './routes/auth.js';
import graduatesRoutes from './routes/graduates.js';
import groupsRoutes from './routes/groups.js';
import requestsRoutes from './routes/requests.js';
import messagesRoutes from './routes/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
// Документы (Согласие на ОПД, Отзыв согласия) — backend/public/docs/
app.use('/docs', express.static(path.join(__dirname, 'public/docs')));

app.use('/api/auth', authRoutes);
app.use('/api/graduates', graduatesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/messages', messagesRoutes);

// Инициализация: создаём admin если таблица users пуста
async function init() {
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM users').get();
  if (count.cnt === 0) {
    const hashed = await bcrypt.hash('admin', 10);
    db.prepare('INSERT INTO users (login, password, role, graduateId) VALUES (?, ?, ?, NULL)')
      .run('admin', hashed, 'admin');
    console.log('Создан admin: login=admin, password=admin');
  }
}

init().then(() => {
  app.listen(PORT, () => console.log(`Backend запущен на http://localhost:${PORT}`));
});
