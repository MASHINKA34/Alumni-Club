import { NavLink, useNavigate } from 'react-router-dom';
import {
  Award, Home, Users, Settings, LogOut, LogIn, X, ClipboardList,
  GraduationCap, UserCircle, MessageSquare, Bell, BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
  const { isAdmin, isMember, user, logout, groups, graduates, unreadCount } = useApp();
  const navigate = useNavigate();

  const hasTeachers = graduates.some((g) => g.roles?.includes('teacher'));

  function handleLogout() {
    logout();
    navigate('/');
    onClose();
  }

  const linkClass = ({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '');

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Award size={22} color="var(--accent)" strokeWidth={2.5} />
        </div>
        <span className="sidebar-logo-text">Клуб Выпускников</span>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Закрыть меню">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Навигация</p>

        <NavLink to="/" end className={linkClass} onClick={onClose}>
          <Home size={16} className="sidebar-link-icon" />
          Главная
        </NavLink>

        <NavLink to="/graduates" end className={linkClass} onClick={onClose}>
          <GraduationCap size={16} className="sidebar-link-icon" />
          Все выпускники
        </NavLink>

        {user && (
          <>
            <NavLink to="/chat" className={linkClass} onClick={onClose}>
              <MessageSquare size={16} className="sidebar-link-icon" />
              Сообщения
              {unreadCount > 0 && <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </NavLink>
            <NavLink to="/notifications" className={linkClass} onClick={onClose}>
              <Bell size={16} className="sidebar-link-icon" />
              Уведомления
            </NavLink>
          </>
        )}

        {(groups.length > 0 || hasTeachers) && (
          <>
            <p className="sidebar-section-label" style={{ marginTop: '1.25rem' }}>Категории</p>
            {hasTeachers && (
              <NavLink
                to="/graduates?role=teacher"
                className="sidebar-link"
                onClick={onClose}
              >
                <BookOpen size={16} className="sidebar-link-icon" />
                Преподаватели
              </NavLink>
            )}
            {groups.map((group) => (
              <NavLink
                key={group}
                to={`/graduates?group=${encodeURIComponent(group)}`}
                className="sidebar-link"
                onClick={onClose}
              >
                <Users size={16} className="sidebar-link-icon" />
                {group}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {!user && (
          <>
            <NavLink
              to="/request/register"
              className={({ isActive }) => 'sidebar-link sidebar-link--request' + (isActive ? ' active' : '')}
              onClick={onClose}
            >
              <ClipboardList size={16} className="sidebar-link-icon" />
              Подать заявку на регистрацию
            </NavLink>
            <NavLink to="/login" className={linkClass} onClick={onClose}>
              <LogIn size={16} className="sidebar-link-icon" />
              Войти
            </NavLink>
          </>
        )}

        {isMember && !isAdmin && (
          <>
            <NavLink to="/profile" className={linkClass} onClick={onClose}>
              <UserCircle size={16} className="sidebar-link-icon" />
              Мой профиль
            </NavLink>
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <LogOut size={16} className="sidebar-link-icon" />
              Выйти ({user?.login})
            </button>
          </>
        )}

        {isAdmin && (
          <>
            <NavLink
              to="/admin"
              className={({ isActive }) => 'sidebar-link admin-link' + (isActive ? ' active' : '')}
              onClick={onClose}
            >
              <Settings size={16} className="sidebar-link-icon" />
              Панель Admin
            </NavLink>
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <LogOut size={16} className="sidebar-link-icon" />
              Выйти
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
