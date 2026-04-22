import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '/api';

export function AppProvider({ children }) {
  const [graduates, setGraduates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';

  // Всегда читает актуальный токен из storage — важно при вызове сразу после login/logout
  function authHeaders() {
    const currentToken = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  }

  async function fetchAll() {
    setLoading(true);
    try {
      const [gradsRes, groupsRes] = await Promise.all([
        fetch(`${API}/graduates`, { headers: authHeaders() }),
        fetch(`${API}/groups`),
      ]);
      setGraduates(await gradsRes.json());
      setGroups(await groupsRes.json());
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function login(loginVal, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginVal, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Неверный логин или пароль');
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    const userData = { role: data.role, graduateId: data.graduateId, login: data.login };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // Рефетч с токеном — получаем реальные фото для авторизованного пользователя
    await fetchAll();
    return data.role;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Рефетч без токена — фото будут скрыты
    fetchAll();
  }

  async function addGraduate(grad) {
    const res = await fetch(`${API}/graduates`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(grad),
    });
    if (!res.ok) throw new Error('Ошибка добавления');
    const newGrad = await res.json();
    setGraduates((prev) => [...prev, newGrad]);
    return newGrad;
  }

  async function updateGraduate(id, data) {
    const res = await fetch(`${API}/graduates/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Ошибка обновления');
    const updated = await res.json();
    setGraduates((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }

  async function deleteGraduate(id) {
    const res = await fetch(`${API}/graduates/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка удаления');
    setGraduates((prev) => prev.filter((g) => g.id !== id));
  }

  async function addGroup(name) {
    const res = await fetch(`${API}/groups`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Ошибка добавления группы');
    }
    const newGroups = await res.json();
    setGroups(newGroups);
  }

  async function deleteGroup(name) {
    const res = await fetch(`${API}/groups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка удаления группы');
    setGroups((prev) => prev.filter((g) => g !== name));
  }

  async function submitRegisterRequest(data) {
    const res = await fetch(`${API}/requests/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка отправки заявки');
    }
  }

  async function submitEditRequest(data) {
    const res = await fetch(`${API}/requests/edit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Ошибка отправки заявки');
  }

  async function submitDeletionRequest(data) {
    const res = await fetch(`${API}/requests/deletion`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Ошибка отправки заявки на удаление');
  }

  async function fetchRequests() {
    const res = await fetch(`${API}/requests`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Ошибка загрузки заявок');
    return res.json();
  }

  async function resolveRequest(id, status) {
    const res = await fetch(`${API}/requests/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка обработки заявки');
    await fetchAll();
    return data;
  }

  return (
    <AppContext.Provider value={{
      graduates, groups, loading, user, isAdmin, isMember,
      login, logout,
      addGraduate, updateGraduate, deleteGraduate,
      addGroup, deleteGroup,
      submitRegisterRequest, submitEditRequest, submitDeletionRequest,
      fetchRequests, resolveRequest,
      refetch: fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
