import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import GraduatesPage from './pages/GraduatesPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import RegisterRequestPage from './pages/RegisterRequestPage';
import EditRequestPage from './pages/EditRequestPage';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-layout">
          {sidebarOpen && (
            <div
              className="sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="app-main">
            <div className="mobile-topbar">
              <button
                className="burger-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Открыть меню"
              >
                <Menu size={22} />
              </button>
              <span className="mobile-topbar-title">Клуб Выпускников</span>
            </div>

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/graduates" element={<GraduatesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/request/register" element={<RegisterRequestPage />} />
              <Route path="/request/edit" element={<EditRequestPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
