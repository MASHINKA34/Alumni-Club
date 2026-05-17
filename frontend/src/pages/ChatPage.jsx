import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Send, ArrowLeft, MessagesSquare, Search, GraduationCap, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

function Avatar({ person }) {
  const initials = (person.name || person.login || '?')
    .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  if (person.photo) {
    return <img src={person.photo} alt="" className="chat-avatar" />;
  }
  return <div className="chat-avatar chat-avatar--fallback">{initials}</div>;
}

function RoleTags({ roles }) {
  if (!roles?.length) return null;
  return (
    <span className="chat-role-tags">
      {roles.includes('teacher') && (
        <span className="chat-role-tag chat-role-tag--teacher"><BookOpen size={10} /> Преподаватель</span>
      )}
      {roles.includes('student') && (
        <span className="chat-role-tag"><GraduationCap size={10} /> Студент</span>
      )}
    </span>
  );
}

export default function ChatPage() {
  const { user, messagesApi } = useApp();
  const { peerId: peerIdParam } = useParams();
  const navigate = useNavigate();
  const peerId = peerIdParam ? Number(peerIdParam) : null;

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [thread, setThread] = useState(null);
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [listLoading, setListLoading] = useState(true);

  const bottomRef = useRef(null);
  const apiRef = useRef(messagesApi);
  apiRef.current = messagesApi;

  const loadList = useCallback(async () => {
    try {
      const [conv, cont] = await Promise.all([
        apiRef.current.conversations(),
        apiRef.current.contacts(),
      ]);
      setConversations(conv);
      setContacts(cont);
    } catch (e) {
      setError(e.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (id) => {
    try {
      const data = await apiRef.current.thread(id);
      setThread(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    const t = setInterval(loadList, 15000);
    return () => clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!peerId) { setThread(null); return; }
    setThread(null);
    loadThread(peerId);
    const t = setInterval(() => loadThread(peerId), 5000);
    return () => clearInterval(t);
  }, [peerId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length]);

  const sidebarItems = useMemo(() => {
    const convMap = new Map(conversations.map((c) => [c.userId, c]));
    const merged = contacts.map((c) => ({ ...c, ...(convMap.get(c.userId) || {}) }));
    const q = search.trim().toLowerCase();
    const filtered = q
      ? merged.filter((p) => (p.name || p.login || '').toLowerCase().includes(q))
      : merged;
    return filtered.sort((a, b) => {
      const at = a.lastMessage?.createdAt || '';
      const bt = b.lastMessage?.createdAt || '';
      if (at || bt) return bt.localeCompare(at);
      return (a.name || a.login).localeCompare(b.name || b.login);
    });
  }, [conversations, contacts, search]);

  if (!user) return <Navigate to="/login" replace />;

  async function handleSend(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending || !peerId) return;
    setSending(true);
    setError('');
    try {
      await messagesApi.send(peerId, text);
      setBody('');
      await loadThread(peerId);
      loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`chat-layout${peerId ? ' chat-layout--thread-open' : ''}`}>
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2 className="chat-sidebar-title">
            <MessagesSquare size={18} /> Сообщения
          </h2>
          <div className="search-wrap chat-search">
            <Search size={14} className="search-icon" />
            <input
              className="search-input"
              placeholder="Поиск собеседника..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-conv-list">
          {listLoading && <p className="chat-empty-hint">Загрузка...</p>}
          {!listLoading && sidebarItems.length === 0 && (
            <p className="chat-empty-hint">Нет доступных собеседников</p>
          )}
          {sidebarItems.map((p) => (
            <button
              key={p.userId}
              className={`chat-conv-item${p.userId === peerId ? ' active' : ''}`}
              onClick={() => navigate(`/chat/${p.userId}`)}
            >
              <Avatar person={p} />
              <div className="chat-conv-info">
                <div className="chat-conv-top">
                  <span className="chat-conv-name">{p.name || p.login}</span>
                  {p.unread > 0 && <span className="chat-unread-badge">{p.unread}</span>}
                </div>
                {p.lastMessage ? (
                  <span className="chat-conv-preview">
                    {p.lastMessage.senderId === user.userId ? 'Вы: ' : ''}
                    {p.lastMessage.body}
                  </span>
                ) : (
                  <RoleTags roles={p.roles} />
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-thread">
        {!peerId ? (
          <div className="chat-thread-empty">
            <MessagesSquare size={48} strokeWidth={1.5} />
            <p>Выберите собеседника, чтобы начать переписку</p>
          </div>
        ) : !thread ? (
          <div className="chat-thread-empty"><p>Загрузка переписки...</p></div>
        ) : (
          <>
            <header className="chat-thread-header">
              <button className="chat-back-btn" onClick={() => navigate('/chat')} aria-label="Назад">
                <ArrowLeft size={18} />
              </button>
              <Avatar person={thread.peer} />
              <div>
                <div className="chat-thread-name">{thread.peer.name || thread.peer.login}</div>
                <RoleTags roles={thread.peer.roles} />
              </div>
            </header>

            <div className="chat-messages">
              {thread.messages.length === 0 && (
                <p className="chat-empty-hint">Сообщений пока нет. Напишите первым!</p>
              )}
              {thread.messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble${m.senderId === user.userId ? ' chat-bubble--out' : ' chat-bubble--in'}`}
                >
                  <span className="chat-bubble-text">{m.body}</span>
                  <span className="chat-bubble-time">
                    {new Date(m.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {error && <p className="form-error chat-error">{error}</p>}

            <form className="chat-composer" onSubmit={handleSend}>
              <textarea
                className="chat-input"
                placeholder="Написать сообщение..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                }}
                rows={1}
              />
              <button className="btn btn-primary chat-send-btn" type="submit" disabled={sending || !body.trim()}>
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
