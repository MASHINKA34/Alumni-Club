import { Link } from 'react-router-dom';
import { Users, GraduationCap, ArrowRight, ClipboardList, UserCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const { graduates, groups, loading, isMember, isAdmin } = useApp();

  const stats = [
    { label: 'Выпускников', value: loading ? '...' : graduates.length, icon: GraduationCap },
    { label: 'Учебных групп', value: loading ? '...' : groups.length, icon: Users },
  ];

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-emblem">
          <img
            src="/volgu-emblem.png"
            alt="Герб ВФ ВолГУ"
            className="home-emblem-img"
          />
        </div>
        <div className="home-hero-text">
          <h1 className="home-hero-title">Клуб Выпускников</h1>
          <p className="home-hero-subtitle">
            Волгоградский государственный университет
          </p>
          <p className="home-hero-desc">
            Площадка для общения и поддержки связи выпускников нашего университета.
            Здесь собраны истории, достижения и контакты тех, кто прошёл путь от студента до профессионала.
          </p>
          <div className="home-hero-actions">
            <Link to="/graduates" className="btn btn-primary home-btn-main">
              Смотреть выпускников
              <ArrowRight size={16} />
            </Link>
            {isMember && !isAdmin ? (
              <Link to="/profile" className="btn btn-secondary home-btn-secondary">
                <UserCircle size={16} />
                Мой профиль
              </Link>
            ) : !isAdmin && (
              <Link to="/request/register" className="btn btn-secondary home-btn-secondary">
                <ClipboardList size={16} />
                Подать заявку на регистрацию
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="home-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="home-stat-card">
              <Icon size={28} color="#6366f1" strokeWidth={1.5} />
              <div className="home-stat-value">{stat.value}</div>
              <div className="home-stat-label">{stat.label}</div>
            </div>
          );
        })}
      </section>

      <section className="home-about">
        <h2 className="home-about-title">О клубе</h2>
        <p className="home-about-text">
          Клуб выпускников — это сообщество людей, объединённых общей альма-матер.
          Мы сохраняем память об учёбе, следим за карьерными успехами друг друга
          и поддерживаем профессиональные связи между поколениями выпускников.
        </p>
        <p className="home-about-text">
          Если вы выпускник нашего университета и хотите быть в базе клуба —
          подайте заявку на регистрацию. Если вы уже зарегистрированы — войдите
          в аккаунт, чтобы редактировать профиль и общаться с другими участниками.
        </p>
      </section>
    </div>
  );
}
