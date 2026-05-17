import express from 'express';
import db, { parseRoles } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const MAX_BODY = 4000;

// Профиль собеседника: имя/фото берём из graduates, иначе из логина
function peerInfo(userRow) {
  const photo = userRow.photoConsent && userRow.photo ? userRow.photo : null;
  return {
    userId: userRow.userId,
    name: userRow.name || userRow.login,
    login: userRow.login,
    role: userRow.role,
    group: userRow.grp || '',
    roles: parseRoles(userRow.roles),
    gender: userRow.gender || 'Мужской',
    photo,
  };
}

const PEER_SELECT = `
  SELECT u.id AS userId, u.login, u.role,
         g.name, g.grp, g.roles, g.photo, g.photoConsent, g.gender
  FROM users u
  LEFT JOIN graduates g ON g.id = u.graduateId
`;

router.use(authenticate);

// Контакты — все пользователи, кроме себя
router.get('/contacts', (req, res) => {
  const rows = db.prepare(`${PEER_SELECT} WHERE u.id <> ? ORDER BY COALESCE(g.name, u.login) COLLATE NOCASE`)
    .all(req.user.id);
  res.json(rows.map(peerInfo));
});

// Список диалогов с последним сообщением и числом непрочитанных
router.get('/conversations', (req, res) => {
  const me = req.user.id;
  const peers = db.prepare(`
    SELECT DISTINCT CASE WHEN senderId = ? THEN recipientId ELSE senderId END AS peerId
    FROM messages
    WHERE senderId = ? OR recipientId = ?
  `).all(me, me, me);

  const result = peers.map(({ peerId }) => {
    const peerRow = db.prepare(`${PEER_SELECT} WHERE u.id = ?`).get(peerId);
    if (!peerRow) return null;
    const last = db.prepare(`
      SELECT body, createdAt, senderId FROM messages
      WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?)
      ORDER BY id DESC LIMIT 1
    `).get(me, peerId, peerId, me);
    const unread = db.prepare(
      'SELECT COUNT(*) AS c FROM messages WHERE senderId = ? AND recipientId = ? AND readAt IS NULL'
    ).get(peerId, me).c;
    return { ...peerInfo(peerRow), lastMessage: last || null, unread };
  }).filter(Boolean);

  result.sort((a, b) =>
    (b.lastMessage?.createdAt || '').localeCompare(a.lastMessage?.createdAt || ''));
  res.json(result);
});

// Общее число непрочитанных (для бейджа уведомлений)
router.get('/unread-count', (req, res) => {
  const c = db.prepare('SELECT COUNT(*) AS c FROM messages WHERE recipientId = ? AND readAt IS NULL')
    .get(req.user.id).c;
  res.json({ count: c });
});

// История переписки с пользователем + пометка входящих прочитанными
router.get('/with/:userId', (req, res) => {
  const me = req.user.id;
  const peerId = Number(req.params.userId);
  const peerRow = db.prepare(`${PEER_SELECT} WHERE u.id = ?`).get(peerId);
  if (!peerRow) return res.status(404).json({ error: 'Пользователь не найден' });

  const messages = db.prepare(`
    SELECT id, senderId, recipientId, body, createdAt, readAt FROM messages
    WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?)
    ORDER BY id ASC
  `).all(me, peerId, peerId, me);

  db.prepare('UPDATE messages SET readAt = ? WHERE senderId = ? AND recipientId = ? AND readAt IS NULL')
    .run(new Date().toISOString(), peerId, me);

  res.json({ peer: peerInfo(peerRow), messages });
});

// Отправка сообщения
router.post('/', (req, res) => {
  const me = req.user.id;
  const recipientId = Number(req.body.recipientId);
  const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';

  if (!recipientId || recipientId === me) {
    return res.status(400).json({ error: 'Некорректный получатель' });
  }
  if (!body) return res.status(400).json({ error: 'Сообщение не может быть пустым' });
  if (body.length > MAX_BODY) {
    return res.status(400).json({ error: `Сообщение слишком длинное (макс. ${MAX_BODY} символов)` });
  }

  const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(recipientId);
  if (!recipient) return res.status(404).json({ error: 'Получатель не найден' });

  const createdAt = new Date().toISOString();
  const info = db.prepare(
    'INSERT INTO messages (senderId, recipientId, body, createdAt) VALUES (?, ?, ?, ?)'
  ).run(me, recipientId, body, createdAt);

  res.status(201).json({ id: info.lastInsertRowid, senderId: me, recipientId, body, createdAt, readAt: null });
});

export default router;
