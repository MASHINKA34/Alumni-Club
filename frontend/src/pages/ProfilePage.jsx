import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  User, Briefcase, CalendarDays, GraduationCap, BookOpen, Trash2, FileText,
  Pencil, Save, XCircle, CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const OTHER_GROUP = '__other__';

export default function ProfilePage() {
  const { user, graduates, groups, loading, updateOwnProfile, submitDeletionRequest } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [deletionSent, setDeletionSent] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionError, setDeletionError] = useState('');

  if (!user) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>
      </div>
    );
  }

  const graduate = user.graduateId ? graduates.find((g) => g.id === user.graduateId) : null;

  const avatarUrl = graduate?.photoConsent && graduate?.photo
    ? graduate.photo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(graduate?.name || 'User')}&background=6366f1&color=fff&size=200`;

  function startEdit() {
    const currentGroup = graduate.group || '';
    const known = groups.includes(currentGroup);
    setForm({
      name: graduate.name || '',
      roles: graduate.roles?.length ? [...graduate.roles] : ['student'],
      group: known ? currentGroup : (currentGroup ? OTHER_GROUP : (groups[0] || '')),
      groupComment: known ? '' : currentGroup,
      graduationYear: graduate.graduationYear || new Date().getFullYear(),
      job: graduate.job || '',
      gender: graduate.gender || 'Мужской',
      facts: [...(graduate.facts || []), '', '', ''].slice(0, 3),
      photo: graduate.photo || '',
      photoConsent: graduate.photoConsent ?? false,
    });
    setPhotoPreview(graduate.photo || '');
    setError('');
    setSuccess('');
    setEditing(true);
  }

  function set(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function toggleRole(role) {
    setForm((p) => {
      const has = p.roles.includes(role);
      let roles = has ? p.roles.filter((r) => r !== role) : [...p.roles, role];
      if (roles.length === 0) roles = [role];
      return { ...p, roles };
    });
  }

  function setFact(i, value) {
    setForm((p) => {
      const facts = [...p.facts];
      facts[i] = value;
      return { ...p, facts };
    });
  }

  function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        setPhotoPreview(compressed);
        set('photo', compressed);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoUrl(value) {
    set('photo', value);
    setPhotoPreview(value);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const isTeacherOnly = form && form.roles.length === 1 && form.roles[0] === 'teacher';
  const isOtherGroup = form?.group === OTHER_GROUP;

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        roles: form.roles,
        graduationYear: Number(form.graduationYear),
        job: form.job,
        gender: form.gender,
        facts: form.facts.filter((f) => f.trim() !== ''),
        photo: form.photo,
        photoConsent: form.photoConsent,
        group: isTeacherOnly ? '' : (isOtherGroup ? (form.groupComment.trim() || 'Другое') : form.group),
      };
      await updateOwnProfile(payload);
      setEditing(false);
      setSuccess('Профиль обновлён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletionRequest() {
    setDeletionError('');
    setDeletionLoading(true);
    try {
      await submitDeletionRequest({});
      setDeletionSent(true);
      setShowDeletionConfirm(false);
    } catch (err) {
      setDeletionError(err.message || 'Ошибка отправки заявки');
    } finally {
      setDeletionLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} color="var(--accent)" />
            Мой профиль
          </h1>
          <p className="page-subtitle">Ваша карточка в базе выпускников</p>
        </div>
      </div>

      {success && (
        <div className="form-success" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
          {success}
        </div>
      )}

      {!graduate ? (
        <div className="admin-form-card" style={{ maxWidth: '480px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Ваш профиль в базе выпускников не найден. Возможно, данные ещё не добавлены.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/request/register')}>
            Подать заявку на регистрацию
          </button>
        </div>
      ) : !editing ? (
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
                  <GraduationCap size={16} color="var(--accent)" />
                  <span className="profile-badges">
                    {graduate.roles?.includes('teacher') && (
                      <span className="modal-group-badge modal-group-badge--teacher">Преподаватель</span>
                    )}
                    {graduate.roles?.includes('student') && graduate.group && (
                      <span className="modal-group-badge">{graduate.group}</span>
                    )}
                  </span>
                </div>
                <div className="profile-meta-item">
                  <CalendarDays size={16} color="var(--accent)" />
                  <span>Год выпуска: {graduate.graduationYear}</span>
                </div>
                {graduate.job && (
                  <div className="profile-meta-item">
                    <Briefcase size={16} color="var(--accent)" />
                    <span>{graduate.job}</span>
                  </div>
                )}
              </div>

              {graduate.facts && graduate.facts.length > 0 && (
                <div className="profile-facts">
                  <div className="profile-facts-title">
                    <BookOpen size={15} color="var(--accent)" />
                    Прочее
                  </div>
                  <ul className="profile-facts-list">
                    {graduate.facts.map((fact, i) => (
                      <li key={i}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={startEdit}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Pencil size={16} />
                  Редактировать профиль
                </button>

                {!deletionSent ? (
                  !showDeletionConfirm ? (
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowDeletionConfirm(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Trash2 size={16} />
                      Подать заявку на удаление аккаунта
                    </button>
                  ) : (
                    <div className="admin-form-card" style={{ padding: '1rem' }}>
                      <p style={{ marginBottom: '0.75rem', fontWeight: '500' }}>
                        Подтвердите заявку на удаление аккаунта
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        После одобрения администратором ваш аккаунт и данные будут удалены из базы.
                        Ознакомьтесь с документом:
                      </p>
                      <a
                        href="/docs/Отзыв_согласия_на_ОПД.docx"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          fontSize: '0.875rem', color: 'var(--accent)',
                          textDecoration: 'underline', marginBottom: '1rem',
                        }}
                      >
                        <FileText size={14} />
                        Отзыв согласия на обработку персональных данных
                      </a>
                      {deletionError && (
                        <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          {deletionError}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-danger" onClick={handleDeletionRequest} disabled={deletionLoading}>
                          {deletionLoading ? 'Отправка...' : 'Подтвердить'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => { setShowDeletionConfirm(false); setDeletionError(''); }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>
                    Заявка на удаление отправлена. Администратор рассмотрит её в ближайшее время.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-form-card" style={{ maxWidth: '560px' }}>
          <h2 className="admin-form-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pencil size={18} color="var(--accent)" /> Редактирование профиля
          </h2>
          <form className="admin-form" onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">ФИО *</label>
              <input
                className="form-input"
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Роль *</label>
              <div className="role-toggle">
                <label className="role-chip">
                  <input
                    type="checkbox"
                    checked={form.roles.includes('student')}
                    onChange={() => toggleRole('student')}
                  />
                  Студент
                </label>
                <label className="role-chip">
                  <input
                    type="checkbox"
                    checked={form.roles.includes('teacher')}
                    onChange={() => toggleRole('teacher')}
                  />
                  Преподаватель
                </label>
              </div>
            </div>

            <div className="form-row">
              {!isTeacherOnly && (
                <div className="form-group">
                  <label className="form-label">Группа *</label>
                  <select
                    className="form-input"
                    value={form.group}
                    onChange={(e) => set('group', e.target.value)}
                    required
                  >
                    <option value="">Выберите группу</option>
                    {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                    <option value={OTHER_GROUP}>Другое (указать)</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Год выпуска *</label>
                <input
                  className="form-input"
                  type="number"
                  min="1990"
                  max="2100"
                  value={form.graduationYear}
                  onChange={(e) => set('graduationYear', e.target.value)}
                  required
                />
              </div>
            </div>

            {!isTeacherOnly && isOtherGroup && (
              <div className="form-group">
                <label className="form-label">Укажите группу / специальность *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.groupComment}
                  onChange={(e) => set('groupComment', e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Пол</label>
                <select
                  className="form-input"
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value)}
                >
                  <option>Мужской</option>
                  <option>Женский</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Место работы</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.job}
                  onChange={(e) => set('job', e.target.value)}
                />
              </div>
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
                  onChange={(e) => setFact(i, e.target.value)}
                />
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Фото (аватарка)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Ссылка на фото (https://...)"
                value={typeof form.photo === 'string' && !form.photo.startsWith('data:') ? form.photo : ''}
                onChange={(e) => handlePhotoUrl(e.target.value)}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0' }}>или загрузите файл:</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFile}
                style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="preview"
                  onError={() => setPhotoPreview('')}
                  style={{
                    marginTop: '0.5rem', width: 72, height: 72,
                    borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)',
                  }}
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label--checkbox">
                <input
                  type="checkbox"
                  checked={form.photoConsent}
                  onChange={(e) => set('photoConsent', e.target.checked)}
                />
                Согласие на публикацию фото
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Save size={15} /> {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => { setEditing(false); setError(''); }}
              >
                <XCircle size={15} /> Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
