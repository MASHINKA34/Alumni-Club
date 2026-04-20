import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { readData, writeData } from './utils/data.js';
import authRoutes from './routes/auth.js';
import graduatesRoutes from './routes/graduates.js';
import groupsRoutes from './routes/groups.js';
import requestsRoutes from './routes/requests.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));
// Документы (Согласие на ОПД, Отзыв согласия и т.д.) — backend/public/docs/
app.use('/docs', express.static(path.join(__dirname, 'public/docs')));

app.use('/api/auth', authRoutes);
app.use('/api/graduates', graduatesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/requests', requestsRoutes);

// Инициализация: создаём admin-пользователя если users.json пуст
async function init() {
  const users = readData('users.json');
  if (users.length === 0) {
    const hashed = await bcrypt.hash('admin', 10);
    users.push({ id: 1, login: 'admin', password: hashed, role: 'admin', graduateId: null });
    writeData('users.json', users);
    console.log('Создан admin: login=admin, password=admin');
  }
}

init().then(() => {
  app.listen(PORT, () => console.log(`Backend запущен на http://localhost:${PORT}`));
});
