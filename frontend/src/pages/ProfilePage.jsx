import { useNavigate, Navigate } from 'react-router-dom';
import { User, Briefcase, CalendarDays, GraduationCap, FilePen, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ProfilePage() {
  const { user, graduates, loading } = useApp();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>
      </div>
    );
  }

  const graduate = user.graduateId
    ? graduates.find((g) => g.id === user.graduateId)
    : null;

  const avatarUrl = graduate?.photoConsent && graduate?.photo
    ? graduate.photo
    : graduate?.gender === 'Женский'
      ? 'https://ui-avatars.com/api/?name=Female&background=ec4899&color=fff&size=200'
      : 'https://ui-avatars.com/api/?name=Male&background=6366f1&color=fff&size=200';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} color="#6366f1" />
            Мой профиль
          </h1>
          <p className="page-subtitle">Ваша карточка в базе выпускников</p>
        </div>
      </div>

      {!graduate ? (
        <div className="admin-form-card" style={{ maxWidth: '480px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Ваш профиль в базе выпускников не найден. Возможно, данные ещё не добавлены.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/request/register')}>
            Подать заявку на регистрацию
          </button>
        </div>
      ) : (
        <div className="profile-card">
          <div className="profile-card-inner">
            <div className="profile-photo-wrap">
              <img
                src={avatarUrl}
                alt={graduate.name}
                className="profile-photo"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(graduate.name)}&background=6366f1&color=fff&size=200`;
                }}
              />
            </div>

            <div className="profile-info">
              <h2 className="profile-name">{graduate.name}</h2>

              <div className="profile-meta">
                <div className="profile-meta-item">
                  <GraduationCap size={16} color="#6366f1" />
                  <span className="modal-group-badge">{graduate.group}</span>
                </div>
                <div className="profile-meta-item">
                  <CalendarDays size={16} color="#6366f1" />
                  <span>Год выпуска: {graduate.graduationYear}</span>
                </div>
                {graduate.job && (
                  <div className="profile-meta-item">
                    <Briefcase size={16} color="#6366f1" />
                    <span>{graduate.job}</span>
                  </div>
                )}
              </div>

              {graduate.facts && graduate.facts.length > 0 && (
                <div className="profile-facts">
                  <div className="profile-facts-title">
                    <BookOpen size={15} color="#6366f1" />
                    Прочее
                  </div>
                  <ul className="profile-facts-list">
                    {graduate.facts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/request/edit')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FilePen size={16} />
                  Подать заявку на редактирование данных
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
