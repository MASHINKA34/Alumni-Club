import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Topbar({ onBurger }) {
  const { theme, toggleTheme, unreadCount, user } = useApp();
  const navigate = useNavigate();
  const badge = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <header className="topbar">
      <button
        className="burger-btn topbar-burger"
        onClick={onBurger}
        aria-label="Открыть меню"
      >
        <Menu size={22} />
      </button>

      <span className="topbar-title">Клуб Выпускников</span>

      <div className="topbar-actions">
        {user && (
          <button
            className="topbar-icon-btn"
            onClick={() => navigate('/chat')}
            aria-label="Сообщения"
            title="Сообщения"
          >
            <MessageSquare size={19} />
          </button>
        )}

        {user && (
          <button
            className="topbar-icon-btn"
            onClick={() => navigate('/notifications')}
            aria-label="Уведомления"
            title="Уведомления"
          >
            <Bell size={19} />
            {unreadCount > 0 && <span className="topbar-badge">{badge}</span>}
          </button>
        )}

        <button
          className="topbar-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  );
}
