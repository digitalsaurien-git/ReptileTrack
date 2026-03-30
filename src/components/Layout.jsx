import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Home, Plug, Settings, Sun, Moon, Euro, X, Check, Drumstick } from "lucide-react";
import { Snake } from "./icons/Snake";
import { useAppContext } from "../store/AppContext";
import "./Layout.css";

export function Layout() {
  const { theme, toggleTheme } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('reptiltrack_webhook_url') || '');

  const saveWebhook = () => {
    localStorage.setItem('reptiltrack_webhook_url', webhookUrl);
    setShowSettings(false);
  };

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={24} />, label: "Dashboard" },
    { to: "/animals", icon: <Snake size={24} />, label: "Animaux" },
    { to: "/terrariums", icon: <Home size={24} />, label: "Terrariums" },
    { to: "/equipments", icon: <Plug size={24} />, label: "Matériel" },
    { to: "/foods", icon: <Drumstick size={24} />, label: "Nourriture" },
    { to: "/finances", icon: <Euro size={24} />, label: "Bilan" }
  ];

  return (
    <div className="app-container">
      <header className="top-header no-print">
         <div style={{ position: 'relative' }}>
            <button 
              className={`theme-btn ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
              title="Paramètres d'automatisation"
            >
              <Settings size={18} />
            </button>

            {showSettings && (
              <div className="glass-panel" style={{ 
                position: 'absolute', 
                top: '120%', 
                right: 0, 
                width: '320px', 
                padding: '1.5rem',
                zIndex: 1100,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}>AUTOMATISATION (MAKE)</h4>
                  <X size={16} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setShowSettings(false)} />
                </div>
                <label style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-muted)' }}>URL du Webhook</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hook.make.com/..."
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                  <button 
                    onClick={saveWebhook}
                    style={{ background: 'var(--primary)', border: 'none', borderRadius: '4px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            )}
         </div>

         <div className="theme-toggle">
            <button 
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => toggleTheme('light')}
              title="Mode Clair"
            >
              <Sun size={18} />
            </button>
            <button 
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => toggleTheme('dark')}
              title="Mode Sombre"
            >
              <Moon size={18} />
            </button>
         </div>
      </header>

      <nav className="sidebar glass-panel">
        <div className="logo">
          <Snake color="var(--primary)" size={32} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
            <h2 style={{ margin: 0 }}>ReptileTrack</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, opacity: 0.9 }}>v2.9</span>
          </div>
        </div>
        
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink 
                to={item.to} 
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main className="main-content animate-fade-in">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav glass-panel">
        {navItems.map((item) => (
          <NavLink 
            key={item.to}
            to={item.to} 
            className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
