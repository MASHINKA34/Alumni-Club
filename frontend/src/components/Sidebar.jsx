import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { groups } from '../data/graduates';

export default function Sidebar() {
  const { isAdmin, logout } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎓</div>
        <span className="sidebar-logo-text">КлубВыпускников</span>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Навигация</p>

        <NavLink to="/" end className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
          <span className="sidebar-link-icon">🏠</span>
          Главная
        </NavLink>

        <p className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Группы</p>
        {groups.map((group) => (
          <NavLink
            key={group}
            to={`/?group=${encodeURIComponent(group)}`}
            className="sidebar-link"
          >
            <span className="sidebar-link-icon">👥</span>
            {group}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {isAdmin ? (
          <>
            <NavLink
              to="/admin"
              className={({ isActive }) => 'sidebar-link admin-link' + (isActive ? ' active' : '')}
            >
              <span className="sidebar-link-icon">⚙️</span>
              Панель Admin
            </NavLink>
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <span className="sidebar-link-icon">🚪</span>
              Выйти
            </button>
          </>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-link-icon">🔑</span>
            Войти (Admin)
          </NavLink>
        )}
      </div>
    </aside>
  );
}
