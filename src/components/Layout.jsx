import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Home, Plug, Settings } from "lucide-react";
import { Snake } from "./icons/Snake";
import "./Layout.css";

export function Layout() {
  const navItems = [
    { to: "/", icon: <LayoutDashboard size={24} />, label: "Dashboard" },
    { to: "/animals", icon: <Snake size={24} />, label: "Animaux" },
    { to: "/terrariums", icon: <Home size={24} />, label: "Terrariums" },
    { to: "/equipments", icon: <Plug size={24} />, label: "Matériel" }
  ];

  return (
    <div className="app-container">
      <nav className="sidebar glass-panel">
        <div className="logo">
          <Snake color="var(--primary)" size={32} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0, lineHeight: 1 }}>ReptilTrack</h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, opacity: 0.8, letterSpacing: '0.05em', marginTop: '0.2rem' }}>EDITION V2.1</span>
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
