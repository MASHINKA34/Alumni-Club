import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { FilePen, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

const OTHER_GROUP = '__other__';

export default function EditRequestPage() {
  const { user, submitEditRequest, graduates, groups } = useApp();
  const fileInputRef = useRef(null);

  const myGraduate = user?.graduateId
    ? graduates.find((g) => g.id === user.graduateId)
    : null;

  const currentGroup = myGraduate?.group || '';
  const isCurrentGroupKnown = groups.includes(currentGroup);

  const [form, setForm] = useState({
    name: myGraduate?.name || '',
    group: isCurrentGroupKnown ? currentGroup : (currentGroup ? OTHER_GROUP : (groups[0] || '')),
    groupComment: isCurrentGroupKnown ? '' : currentGroup,
    graduationYear: myGraduate?.graduationYear || new Date().getFullYear(),
    job: myGraduate?.job || '',
    gender: myGraduate?.gender || 'Мужской',
    facts: [...(myGraduate?.facts || []), '', '', ''].slice(0, 3),
    message: '',
    photo: myGraduate?.photo || '',
  });
  const [photoPreview, setPhotoPreview] = useState(myGraduate?.photo || '');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isOtherGroup = form.group === OTHER_GROUP;

  if (!user) return <Navigate to="/login" replace />;

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
        handleChange('photo', compressed);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoUrl(value) {
    handleChange('photo', value);
    setPhotoPreview(value);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitEditRequest({
        ...form,
        graduationYear: Number(form.graduationYear),
        facts: form.facts.filter((f) => f.trim() !== ''),
        group: isOtherGroup ? 'Другое' : form.group,
        groupComment: isOtherGroup ? form.groupComment : undefined,
        graduateId: user.graduateId || null,
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
            Ваша заявка на редактирование данных принята. Администратор рассмотрит её в ближайшее время.
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
            <FilePen size={24} color="#6366f1" />
            Заявка на редактирование данных
          </h1>
          <p className="page-subtitle">Укажите актуальную информацию о себе</p>
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
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                <option value={OTHER_GROUP}>Другое (укажите в комментарии)</option>
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

          {isOtherGroup && (
            <div className="form-group">
              <label className="form-label">Комментарий к группе *</label>
              <input
                className="form-input"
                type="text"
                placeholder="Укажите вашу группу или специальность"
                value={form.groupComment}
                onChange={(e) => handleChange('groupComment', e.target.value)}
                required
              />
            </div>
          )}

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
            <label className="form-label">Фото (аватарка)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Вставьте ссылку на фото (https://...)"
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
                  marginTop: '0.5rem',
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent)',
                }}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Что изменилось / дополнительно</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Опишите, что именно нужно обновить..."
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
