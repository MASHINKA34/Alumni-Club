import { createContext, useContext, useState } from 'react';
import { graduates as initialGraduates } from '../data/graduates';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [graduates, setGraduates] = useState(initialGraduates);
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem('isAdmin') === 'true'
  );

  function login(login, password) {
    if (login === 'admin' && password === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    return false;
  }

  function logout() {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  }

  function addGraduate(grad) {
    const newGrad = { ...grad, id: Date.now() };
    setGraduates((prev) => [...prev, newGrad]);
  }

  function updateGraduate(id, data) {
    setGraduates((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data } : g))
    );
  }

  function deleteGraduate(id) {
    setGraduates((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <AppContext.Provider
      value={{ graduates, isAdmin, login, logout, addGraduate, updateGraduate, deleteGraduate }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
