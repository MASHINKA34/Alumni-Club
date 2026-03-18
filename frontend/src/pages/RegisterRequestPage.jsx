import { useState } from 'react';
import { ClipboardList, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RegisterRequestPage() {
  const { submitRegisterRequest, groups } = useApp();
  const [form, setForm] = useState({
    name: '',
    group: '',
    graduationYear: new Date().getFullYear(),
    job: '',
    gender: 'Мужской',
    photoConsent: false,
    facts: ['', '', ''],
    message: '',
    password: '',
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFactChange(i, value) {
    setForm((prev) => {
      const facts = [...prev.facts];
      facts[i] = value;
      return { ...prev, facts };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitRegisterRequest({
        ...form,
        graduationYear: Number(form.graduationYear),
        facts: form.facts.filter((f) => f.trim() !== ''),
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Ошибка отправки заявки');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-icon">
            <CheckCircle2 size={48} color="#22c55e" strokeWidth={1.5} />
          </div>
          <h1 className="login-title">Заявка отправлена</h1>
          <p className="login-subtitle">
            Ваша заявка на регистрацию принята. Администратор рассмотрит её в ближайшее время.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={24} color="#6366f1" />
            Заявка на регистрацию
          </h1>
          <p className="page-subtitle">Заполните форму, чтобы войти в базу выпускников</p>
        </div>
      </div>

      <div className="admin-form-card" style={{ maxWidth: '560px' }}>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ФИО *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Иванов Иван Иванович"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Группа *</label>
              <select
                className="form-input"
                value={form.group}
                onChange={(e) => handleChange('group', e.target.value)}
                required
              >
                <option value="">Выберите группу</option>
                {groups.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Год выпуска *</label>
              <input
                className="form-input"
                type="number"
                placeholder="2024"
                min="1990"
                max="2100"
                value={form.graduationYear}
                onChange={(e) => handleChange('graduationYear', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Пол</label>
              <select
                className="form-input"
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option>Мужской</option>
                <option>Женский</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Место работы</label>
            <input
              className="form-input"
              type="text"
              placeholder="Текущее место работы"
              value={form.job}
              onChange={(e) => handleChange('job', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Прочее (до 3 пунктов)</label>
            {form.facts.map((fact, i) => (
              <input
                key={i}
                className="form-input"
                style={{ marginBottom: '0.5rem' }}
                type="text"
                placeholder={`Пункт ${i + 1}`}
                value={fact}
                onChange={(e) => handleFactChange(i, e.target.value)}
              />
            ))}
          </div>

          <div className="form-group">
            <label className="form-label form-label--checkbox">
              <input
                type="checkbox"
                checked={form.photoConsent}
                onChange={(e) => handleChange('photoConsent', e.target.checked)}
              />
              Даю согласие на публикацию фотографии
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Пароль для входа *</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              После одобрения заявки вы сможете войти в личный кабинет. Логин — ваше ФИО.
            </p>
            <input
              className="form-input"
              type="password"
              placeholder="Придумайте пароль"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Дополнительное сообщение</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Любая дополнительная информация..."
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="form-error">
              <ShieldAlert size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
              {error}
            </p>
          )}

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
