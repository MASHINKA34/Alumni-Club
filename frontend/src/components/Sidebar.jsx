import { NavLink, useNavigate } from 'react-router-dom';
import { Award, Home, Users, Settings, LogOut, LogIn, X, ClipboardList, FilePen, GraduationCap, UserCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
  const { isAdmin, isMember, user, logout, groups } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
    onClose();
  }

  function handleNavClick() {
    onClose();
  }

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Award size={22} color="#6366f1" strokeWidth={2.5} />
        </div>
        <span className="sidebar-logo-text">Клуб Выпускников</span>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Закрыть меню">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Навигация</p>

        <NavLink
          to="/"
          end
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          onClick={handleNavClick}
        >
          <Home size={16} className="sidebar-link-icon" />
          Главная
        </NavLink>

        <NavLink
          to="/graduates"
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          onClick={handleNavClick}
        >
          <GraduationCap size={16} className="sidebar-link-icon" />
          Все выпускники
        </NavLink>

        {groups.length > 0 && (
          <>
            <p className="sidebar-section-label" style={{ marginTop: '1.25rem' }}>Группы</p>
            {groups.map((group) => (
              <NavLink
                key={group}
                to={`/graduates?group=${encodeURIComponent(group)}`}
                className="sidebar-link"
                onClick={handleNavClick}
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
              onClick={handleNavClick}
            >
              <ClipboardList size={16} className="sidebar-link-icon" />
              Подать заявку на регистрацию
            </NavLink>
            <NavLink
              to="/login"
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
              onClick={handleNavClick}
            >
              <LogIn size={16} className="sidebar-link-icon" />
              Войти
            </NavLink>
          </>
        )}

        {isMember && !isAdmin && (
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
              onClick={handleNavClick}
            >
              <UserCircle size={16} className="sidebar-link-icon" />
              Мой профиль
            </NavLink>
            <NavLink
              to="/request/edit"
              className={({ isActive }) => 'sidebar-link sidebar-link--request' + (isActive ? ' active' : '')}
              onClick={handleNavClick}
            >
              <FilePen size={16} className="sidebar-link-icon" />
              Подать заявку на редактирование данных
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
              onClick={handleNavClick}
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
