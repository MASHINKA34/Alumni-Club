import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '/api';

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function AppProvider({ children }) {
  const [graduates, setGraduates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [theme, setTheme] = useState(getInitialTheme);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  // Всегда читает актуальный токен из storage — важно при вызове сразу после login/logout
  const authHeaders = useCallback(() => {
    const currentToken = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  }, []);

  const fetchAll = useCallback(async () => {
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
  }, [authHeaders]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Валидируем сессию и подтягиваем актуальные данные (в т.ч. userId для чатов)
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    (async () => {
      try {
        const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          return;
        }
        if (res.ok) {
          const fresh = await res.json();
          localStorage.setItem('user', JSON.stringify(fresh));
          setUser((prev) => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
        }
      } catch { /* офлайн — оставляем кэш */ }
    })();
  }, [authHeaders]);

  const refreshUnread = useCallback(async () => {
    if (!localStorage.getItem('token')) { setUnreadCount(0); return; }
    try {
      const res = await fetch(`${API}/messages/unread-count`, { headers: authHeaders() });
      if (res.ok) setUnreadCount((await res.json()).count || 0);
    } catch { /* нет сети — игнорируем */ }
  }, [authHeaders]);

  // Поллинг непрочитанных, пока пользователь авторизован
  const userId = user?.userId;
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    refreshUnread();
    const t = setInterval(refreshUnread, 15000);
    return () => clearInterval(t);
  }, [user, userId, refreshUnread]);

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
    const userData = { role: data.role, graduateId: data.graduateId, login: data.login, userId: data.userId };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    await fetchAll();
    return data.role;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUnreadCount(0);
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

  async function updateOwnProfile(data) {
    const res = await fetch(`${API}/graduates/me`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const updated = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(updated.error || 'Ошибка сохранения профиля');
    setGraduates((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    // Логин мог синхронизироваться с новым ФИО
    if (updated.userLogin && user && updated.userLogin !== user.login) {
      const next = { ...user, login: updated.userLogin };
      localStorage.setItem('user', JSON.stringify(next));
      setUser(next);
    }
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
    setGroups(await res.json());
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

  async function submitDeletionRequest(data) {
    const res = await fetch(`${API}/requests/deletion`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Ошибка отправки заявки на удаление');
  }

  async function deleteRequest(id) {
    const res = await fetch(`${API}/requests/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Ошибка удаления заявки');
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

  // ===== Сообщения =====
  const messagesApi = {
    contacts: async () => {
      const res = await fetch(`${API}/messages/contacts`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Ошибка загрузки контактов');
      return res.json();
    },
    conversations: async () => {
      const res = await fetch(`${API}/messages/conversations`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Ошибка загрузки диалогов');
      return res.json();
    },
    thread: async (peerId) => {
      const res = await fetch(`${API}/messages/with/${peerId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Ошибка загрузки переписки');
      const data = await res.json();
      refreshUnread();
      return data;
    },
    send: async (recipientId, body) => {
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ recipientId, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки сообщения');
      return data;
    },
  };

  return (
    <AppContext.Provider value={{
      graduates, groups, loading, user, isAdmin, isMember,
      theme, toggleTheme,
      unreadCount, refreshUnread,
      login, logout,
      addGraduate, updateGraduate, updateOwnProfile, deleteGraduate,
      addGroup, deleteGroup,
      submitRegisterRequest, submitDeletionRequest,
      fetchRequests, resolveRequest, deleteRequest,
      messagesApi,
      refetch: fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  return useContext(AppContext);
}
