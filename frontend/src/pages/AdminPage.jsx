import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, UserCog, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { groups } from '../data/graduates';

const emptyForm = {
  name: '',
  photo: '',
  group: groups[0],
  years: '',
  job: '',
  gender: 'Мужской',
  facts: ['', '', ''],
};

export default function AdminPage() {
  const { graduates, isAdmin, addGraduate, updateGraduate, deleteGraduate } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [filterGroup, setFilterGroup] = useState('Все');
  const [success, setSuccess] = useState('');

  if (!isAdmin) return <Navigate to="/login" replace />;

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

  function handleSubmit(e) {
    e.preventDefault();
    const data = {
      ...form,
      facts: form.facts.filter((f) => f.trim() !== ''),
    };
    if (editId !== null) {
      updateGraduate(editId, data);
      setSuccess('Выпускник обновлён!');
    } else {
      addGraduate(data);
      setSuccess('Выпускник добавлен!');
    }
    setForm(emptyForm);
    setEditId(null);
    setTimeout(() => setSuccess(''), 3000);
  }

  function handleEdit(grad) {
    setEditId(grad.id);
    setForm({
      name: grad.name,
      photo: grad.photo,
      group: grad.group,
      years: grad.years,
      job: grad.job,
      gender: grad.gender,
      facts: [...grad.facts, '', '', ''].slice(0, 3),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id) {
    if (window.confirm('Удалить этого выпускника?')) {
      deleteGraduate(id);
    }
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditId(null);
  }

  const visibleGrads = filterGroup === 'Все'
    ? graduates
    : graduates.filter((g) => g.group === filterGroup);

  return (
    <div className="page admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <LayoutDashboard size={24} color="#6366f1" />
            Панель администратора
          </h1>
          <p className="page-subtitle">Управление базой выпускников</p>
        </div>
      </div>

      <div className="admin-layout">
        <div className="admin-form-card">
          <h2 className="admin-form-title" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            {editId !== null
              ? <><UserCog size={18} color="#6366f1" /> Редактировать выпускника</>
              : <><UserPlus size={18} color="#6366f1" /> Добавить выпускника</>
            }
          </h2>
          {success && (
            <div className="form-success">
              <CheckCircle2 size={13} style={{ display:'inline', marginRight:'5px', verticalAlign:'middle' }} />
              {success}
            </div>
          )}
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
                >
                  {groups.map((g) => <option key={g}>{g}</option>)}
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
              <label className="form-label">Годы обучения *</label>
              <input
                className="form-input"
                type="text"
                placeholder="2020–2024"
                value={form.years}
                onChange={(e) => handleFormChange('years', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Место работы *</label>
              <input
                className="form-input"
                type="text"
                placeholder="Frontend-разработчик в Яндексе"
                value={form.job}
                onChange={(e) => handleFormChange('job', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">URL фотографии</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://..."
                value={form.photo}
                onChange={(e) => handleFormChange('photo', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Интересные факты (до 3)</label>
              {form.facts.map((fact, i) => (
                <input
                  key={i}
                  className="form-input"
                  style={{ marginBottom: '0.5rem' }}
                  type="text"
                  placeholder={`Факт ${i + 1}`}
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
                  <th>Годы</th>
                  <th>Работа</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {visibleGrads.map((grad) => (
                  <tr key={grad.id}>
                    <td>
                      <img
                        src={grad.photo}
                        alt=""
                        className="admin-table-photo"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(grad.name)}&background=6366f1&color=fff&size=60`;
                        }}
                      />
                    </td>
                    <td className="admin-table-name">{grad.name}</td>
                    <td><span className="modal-group-badge">{grad.group}</span></td>
                    <td>{grad.years}</td>
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
    </div>
  );
}