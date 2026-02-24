import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const ok = login(form.login, form.password);
    if (ok) {
      navigate('/admin');
    } else {
      setError('Неверный логин или пароль');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <KeyRound size={40} color="#6366f1" strokeWidth={1.5} />
        </div>
        <h1 className="login-title">Вход для администратора</h1>
        <p className="login-subtitle">Только для уполномоченных сотрудников</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Логин</label>
            <input
              className="form-input"
              type="text"
              placeholder="Введите логин"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
              placeholder="Введите пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && (
            <p className="form-error">
              <ShieldAlert size={13} style={{ display:'inline', marginRight:'5px', verticalAlign:'middle' }} />
              {error}
            </p>
          )}
          <button className="btn btn-primary" type="submit">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
