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
          <h2>ReptilTrack</h2>
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
