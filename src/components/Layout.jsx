import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Home, Plug, Settings, Sun, Moon } from "lucide-react";
import { Snake } from "./icons/Snake";
import { useAppContext } from "../store/AppContext";
import "./Layout.css";

export function Layout() {
  const { theme, toggleTheme } = useAppContext();
  const navItems = [
    { to: "/", icon: <LayoutDashboard size={24} />, label: "Dashboard" },
    { to: "/animals", icon: <Snake size={24} />, label: "Animaux" },
    { to: "/terrariums", icon: <Home size={24} />, label: "Terrariums" },
    { to: "/equipments", icon: <Plug size={24} />, label: "Matériel" }
  ];

  return (
    <div className="app-container">
      <header className="top-header no-print">
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
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, opacity: 0.9 }}>v2.1</span>
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
