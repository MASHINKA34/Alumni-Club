import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Bell, MessageSquare, ClipboardList, BellOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function NotificationsPage() {
  const { user, isAdmin, messagesApi, fetchRequests } = useApp();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const conv = await messagesApi.conversations();
      setConversations(conv.filter((c) => c.unread > 0));
      if (isAdmin) {
        const reqs = await fetchRequests().catch(() => []);
        setPendingRequests(reqs.filter((r) => r.status === 'pending').length);
      }
    } catch { /* игнорируем */ } finally {
      setLoading(false);
    }
  }, [messagesApi, isAdmin, fetchRequests]);

  useEffect(() => { load(); }, [load]);

  if (!user) return <Navigate to="/login" replace />;

  const hasNotifications = conversations.length > 0 || pendingRequests > 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={24} color="var(--accent)" />
            Уведомления
          </h1>
          <p className="page-subtitle">Новые сообщения и события</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>
      ) : !hasNotifications ? (
        <div className="empty-state">
          <BellOff size={48} strokeWidth={1.5} />
          <p>Новых уведомлений нет</p>
        </div>
      ) : (
        <div className="notif-list">
          {isAdmin && pendingRequests > 0 && (
            <Link to="/admin" className="notif-item">
              <div className="notif-icon notif-icon--req"><ClipboardList size={18} /></div>
              <div className="notif-body">
                <span className="notif-title">Заявки на рассмотрении</span>
                <span className="notif-text">{pendingRequests} необработанных заявок</span>
              </div>
            </Link>
          )}

          {conversations.map((c) => (
            <button
              key={c.userId}
              className="notif-item"
              onClick={() => navigate(`/chat/${c.userId}`)}
            >
              <div className="notif-icon notif-icon--msg"><MessageSquare size={18} /></div>
              <div className="notif-body">
                <span className="notif-title">
                  {c.name || c.login}
                  <span className="chat-unread-badge" style={{ marginLeft: '0.5rem' }}>{c.unread}</span>
                </span>
                <span className="notif-text">{c.lastMessage?.body || 'Новое сообщение'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
