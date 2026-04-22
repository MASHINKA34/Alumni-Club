import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, UserCog, Pencil, Trash2, CheckCircle2,
  FolderPlus, Folder, Check, X, Clock, Users, ClipboardList,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const emptyForm = {
  name: '',
  photo: '',
  photoConsent: true,
  group: '',
  graduationYear: new Date().getFullYear(),
  job: '',
  gender: 'Мужской',
  facts: ['', '', ''],
  userLogin: '',
  password: '',
};

export default function AdminPage() {
  const {
    graduates, groups, isAdmin,
    addGraduate, updateGraduate, deleteGraduate,
    addGroup, deleteGroup,
    fetchRequests, resolveRequest, deleteRequest,
  } = useApp();

  const [tab, setTab] = useState('graduates');
  const [form, setForm] = useState({ ...emptyForm, group: groups[0] || '' });
  const [editId, setEditId] = useState(null);
  const [filterGroup, setFilterGroup] = useState('Все');
  const [success, setSuccess] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
  const [requestSearch, setRequestSearch] = useState('');

  // Предзагружаем заявки сразу при открытии панели, а не только при клике на вкладку
  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && tab === 'requests' && requests.length === 0) loadRequests();
  }, [tab]);

  if (!isAdmin) return <Navigate to="/login" replace />;

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFactChange(index, value) {
    setForm((prev) => {
      const facts = [...prev.facts];
      facts[index] = value;
      return { ...prev, facts };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      ...form,
      graduationYear: Number(form.graduationYear),
      facts: form.facts.filter((f) => f.trim() !== ''),
    };
    try {
      if (editId !== null) {
        await updateGraduate(editId, data);
        showSuccess('Выпускник обновлён!');
      } else {
        await addGraduate(data);
        showSuccess('Выпускник добавлен!');
      }
      setForm({ ...emptyForm, group: groups[0] || '' });
      setEditId(null);
    } catch (err) {
      showSuccess('Ошибка: ' + err.message);
    }
  }

  function handleEdit(grad) {
    setEditId(grad.id);
    const groupValue = groups.includes(grad.group) ? grad.group : (groups[0] || '');
    setForm({
      name: grad.name,
      photo: grad.photo || '',
      photoConsent: grad.photoConsent ?? true,
      group: groupValue,
      graduationYear: grad.graduationYear,
      job: grad.job || '',
      gender: grad.gender || 'Мужской',
      facts: [...(grad.facts || []), '', '', ''].slice(0, 3),
      userLogin: grad.userLogin || '',
      password: '',
    });
    setTab('graduates');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить этого выпускника?')) return;
    try {
      await deleteGraduate(id);
      showSuccess('Выпускник удалён');
    } catch (err) {
      showSuccess('Ошибка: ' + err.message);
    }
  }

  function handleCancel() {
    setForm({ ...emptyForm, group: groups[0] || '' });
    setEditId(null);
  }

  async function handleAddGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await addGroup(newGroupName.trim());
      setNewGroupName('');
      showSuccess(`Группа ${newGroupName.trim()} добавлена`);
    } catch (err) {
      showSuccess('Ошибка: ' + err.message);
    }
  }

  async function handleDeleteGroup(name) {
    if (!window.confirm(`Удалить группу ${name}?`)) return;
    try {
      await deleteGroup(name);
      showSuccess(`Группа ${name} удалена`);
    } catch (err) {
      showSuccess('Ошибка: ' + err.message);
    }
  }

  async function loadRequests() {
    setRequestsLoading(true);
    try {
      const data = await fetchRequests();
      setRequests([...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  }


  async function confirmAndDelete(id) {
    try {
      await deleteRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showSuccess('Заявка удалена');
    } catch (err) {
      showSuccess('Ошибка: ' + err.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleResolve(id, status) {
    if (resolvingId !== null) return;
    setResolvingId(id);
    try {
      await resolveRequest(id, status);
      await loadRequests();
      showSuccess(status === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена');
    } catch (err) {
      showSuccess('Ошибка: ' + err.message);
    } finally {
      setResolvingId(null);
    }
  }

  const visibleGrads = filterGroup === 'Все'
    ? graduates
    : graduates.filter((g) => g.group === filterGroup);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="page admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={24} color="#6366f1" />
            Панель администратора
          </h1>
          <p className="page-subtitle">Управление базой выпускников</p>
        </div>
      </div>

      {success && (
        <div className="form-success" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
          {success}
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'graduates' ? ' active' : ''}`}
          onClick={() => setTab('graduates')}
        >
          <Users size={16} />
          Выпускники
        </button>
        <button
          className={`admin-tab${tab === 'groups' ? ' active' : ''}`}
          onClick={() => setTab('groups')}
        >
          <Folder size={16} />
          Группы
        </button>
        <button
          className={`admin-tab${tab === 'requests' ? ' active' : ''}`}
          onClick={() => setTab('requests')}
        >
          <ClipboardList size={16} />
          Заявки
          {pendingCount > 0 && (
            <span className="admin-tab-badge">{pendingCount}</span>
          )}
        </button>
      </div>

      {tab === 'graduates' && (
        <div className="admin-layout">
          <div className="admin-form-card">
            <h2 className="admin-form-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editId !== null
                ? <><UserCog size={18} color="#6366f1" /> Редактировать выпускника</>
                : <><UserPlus size={18} color="#6366f1" /> Добавить выпускника</>
              }
            </h2>
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">ФИО *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Группа *</label>
                  <select
                    className="form-input"
                    value={form.group}
                    onChange={(e) => handleFormChange('group', e.target.value)}
                    required
                  >
                    {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Пол</label>
                  <select
                    className="form-input"
                    value={form.gender}
                    onChange={(e) => handleFormChange('gender', e.target.value)}
                  >
                    <option>Мужской</option>
                    <option>Женский</option>
                  </select>
                </div>
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
                  onChange={(e) => handleFormChange('graduationYear', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Место работы</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Frontend-разработчик в Яндексе"
                  value={form.job}
                  onChange={(e) => handleFormChange('job', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL фотографии</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="https://..."
                  value={form.photo}
                  onChange={(e) => handleFormChange('photo', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label form-label--checkbox">
                  <input
                    type="checkbox"
                    checked={form.photoConsent}
                    onChange={(e) => handleFormChange('photoConsent', e.target.checked)}
                  />
                  Согласие на публикацию фото
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Аккаунт выпускника</label>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Логин</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="ivan.ivanov"
                      value={form.userLogin}
                      onChange={(e) => handleFormChange('userLogin', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Пароль{editId !== null ? ' (оставьте пустым, чтобы не менять)' : ''}
                    </label>
                    <input
                      className="form-input"
                      type="password"
                      placeholder={editId !== null ? 'Новый пароль...' : 'Пароль для входа'}
                      value={form.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                    />
                  </div>
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
                    onChange={(e) => handleFactChange(i, e.target.value)}
                  />
                ))}
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  {editId !== null ? 'Сохранить' : 'Добавить'}
                </button>
                {editId !== null && (
                  <button className="btn btn-secondary" type="button" onClick={handleCancel}>
                    Отмена
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-list-section">
            <div className="admin-list-header">
              <h2 className="admin-form-title">Список выпускников</h2>
              <select
                className="form-input"
                style={{ width: 'auto' }}
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option>Все</option>
                {groups.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Фото</th>
                    <th>ФИО</th>
                    <th>Группа</th>
                    <th>Год</th>
                    <th>Работа</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleGrads.map((grad) => (
                    <tr key={grad.id}>
                      <td>
                        <img
                          src={grad.photoConsent && grad.photo
                            ? grad.photo
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(grad.name)}&background=6366f1&color=fff&size=60`}
                          alt=""
                          className="admin-table-photo"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(grad.name)}&background=6366f1&color=fff&size=60`;
                          }}
                        />
                      </td>
                      <td className="admin-table-name">{grad.name}</td>
                      <td><span className="modal-group-badge">{grad.group}</span></td>
                      <td>{grad.graduationYear}</td>
                      <td className="admin-table-job">{grad.job}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => handleEdit(grad)}
                            title="Редактировать"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDelete(grad.id)}
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'groups' && (
        <div className="admin-groups-section">
          <div className="admin-form-card" style={{ maxWidth: '480px' }}>
            <h2 className="admin-form-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderPlus size={18} color="#6366f1" />
              Добавить группу
            </h2>
            <form className="admin-form" onSubmit={handleAddGroup}>
              <div className="form-group">
                <label className="form-label">Название группы *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="ИСП-301"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">Добавить группу</button>
              </div>
            </form>
          </div>

          <div className="admin-groups-list">
            <h2 className="admin-form-title" style={{ marginBottom: '0.75rem' }}>Все группы</h2>
            {groups.map((group) => (
              <div key={group} className="admin-group-row">
                <div className="admin-group-info">
                  <Folder size={16} color="#6366f1" />
                  <span>{group}</span>
                  <span className="group-count" style={{ marginLeft: '0.5rem' }}>
                    {graduates.filter((g) => g.group === group).length} чел.
                  </span>
                </div>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteGroup(group)}
                  title="Удалить группу"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="admin-requests-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h2 className="admin-form-title" style={{ margin: 0 }}>Заявки</h2>
            <input
              className="form-input"
              style={{ maxWidth: '280px', flex: '1' }}
              type="text"
              placeholder="Поиск по ФИО..."
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
            />
            {requestsLoading && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Обновление...</span>}
          </div>
          {(() => {
            if (!requestsLoading && requests.length === 0) return (
              <div className="empty-state">
                <ClipboardList size={40} strokeWidth={1.5} />
                <p>Заявок пока нет</p>
              </div>
            );
            const q = requestSearch.trim().toLowerCase();
            const visible = q ? requests.filter(r => (r.name || '').toLowerCase().includes(q)) : requests;
            if (q && visible.length === 0) return (
              <div className="empty-state">
                <ClipboardList size={32} strokeWidth={1.5} />
                <p>Ничего не найдено по запросу «{requestSearch}»</p>
              </div>
            );
            return visible.map((req) => (
            <div key={req.id} className="request-card">
              <div className="request-card-header">
                <div className="request-card-meta">
                  <span className={`request-type-badge request-type-badge--${req.type}`}>
                    {req.type === 'registration' && 'Регистрация'}
                    {req.type === 'edit' && 'Редактирование'}
                    {req.type === 'deletion' && 'Удаление аккаунта'}
                  </span>
                  <span className={`request-status-badge request-status-badge--${req.status}`}>
                    {req.status === 'pending' && <><Clock size={12} /> На рассмотрении</>}
                    {req.status === 'approved' && <><Check size={12} /> Одобрено</>}
                    {req.status === 'rejected' && <><X size={12} /> Отклонено</>}
                  </span>
                  <span className="request-date">
                    {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="request-card-actions">
                  {req.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-small btn-success"
                        onClick={() => handleResolve(req.id, 'approved')}
                        disabled={resolvingId !== null}
                      >
                        {resolvingId === req.id ? '...' : <><Check size={14} /> Одобрить</>}
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleResolve(req.id, 'rejected')}
                        disabled={resolvingId !== null}
                      >
                        {resolvingId === req.id ? '...' : <><X size={14} /> Отклонить</>}
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => setConfirmDelete({ id: req.id, label: req.name || 'заявку' })}
                    title="Удалить заявку"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="request-card-body">
                {req.name && <p><strong>Имя:</strong> {req.name}</p>}
                {req.group && <p><strong>Группа:</strong> {req.group}</p>}
                {req.graduationYear && <p><strong>Год выпуска:</strong> {req.graduationYear}</p>}
                {req.job && <p><strong>Место работы:</strong> {req.job}</p>}
                {req.facts && req.facts.length > 0 && (
                  <p><strong>Прочее:</strong> {req.facts.join('; ')}</p>
                )}
                {req.groupComment && <p><strong>Комментарий к группе:</strong> {req.groupComment}</p>}
                {req.passwordPlain && <p><strong>Пароль:</strong> {req.passwordPlain}</p>}
                {req.message && <p><strong>Сообщение:</strong> {req.message}</p>}
              </div>
            </div>
          ));
          })()}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon"><Trash2 size={28} color="var(--danger)" /></div>
            <h3 className="confirm-modal-title">Удалить заявку?</h3>
            <p className="confirm-modal-text">
              Заявка от <strong>{confirmDelete.label}</strong> будет безвозвратно удалена.
            </p>
            <div className="confirm-modal-actions">
              <button className="btn btn-danger" onClick={() => confirmAndDelete(confirmDelete.id)}>
                Удалить
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
