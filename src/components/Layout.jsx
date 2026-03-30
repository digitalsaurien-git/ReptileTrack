import { useState, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Home, Plug, Settings, Sun, Moon, Euro, X, Check, Drumstick, Download, Upload, LogOut, Smartphone } from "lucide-react";
import { Snake } from "./icons/Snake";
import { useAppContext } from "../store/AppContext";
import "./Layout.css";

export function Layout() {
  const { theme, toggleTheme, signOut, user, setIsGuest } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('reptiltrack_webhook_url') || '');

  const saveWebhook = () => {
    localStorage.setItem('reptiltrack_webhook_url', webhookUrl);
    setShowSettings(false);
  };

  const fileInputRef = useRef(null);

  const handleLogout = () => {
    signOut();
  };

  const handleExportData = () => {
    const data = {
      animals: JSON.parse(localStorage.getItem('reptiltrack_animals') || '[]'),
      terrariums: JSON.parse(localStorage.getItem('reptiltrack_terrariums') || '[]'),
      equipments: JSON.parse(localStorage.getItem('reptiltrack_equipments') || '[]'),
      foods: JSON.parse(localStorage.getItem('reptiltrack_foods') || '[]'),
      settings: JSON.parse(localStorage.getItem('reptiltrack_settings') || '{}')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reptiltrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.animals) localStorage.setItem('reptiltrack_animals', JSON.stringify(data.animals));
        if (data.terrariums) localStorage.setItem('reptiltrack_terrariums', JSON.stringify(data.terrariums));
        if (data.equipments) localStorage.setItem('reptiltrack_equipments', JSON.stringify(data.equipments));
        if (data.foods) localStorage.setItem('reptiltrack_foods', JSON.stringify(data.foods));
        if (data.settings) localStorage.setItem('reptiltrack_settings', JSON.stringify(data.settings));
        
        alert("✅ Restauration réussie ! L'application va se recharger.");
        window.location.reload();
      } catch (err) {
        alert("❌ Erreur lors de la lecture du fichier de sauvegarde. Assurez-vous qu'il s'agit d'un fichier .json valide provenant de ReptilTrack.");
      }
    };
    reader.readAsText(file);
  };

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={24} />, label: "Dashboard" },
    { to: "/animals", icon: <Snake size={24} />, label: "Animaux" },
    { to: "/terrariums", icon: <Home size={24} />, label: "Terrariums" },
    { to: "/equipments", icon: <Plug size={24} />, label: "Matériel" },
    { to: "/foods", icon: <Drumstick size={24} />, label: "Nourriture" },
    { to: "/finances", icon: <Euro size={24} />, label: "Bilan" },
    { to: "/domotics", icon: <Smartphone size={24} />, label: "Domotique" }
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
                bottom: '120%', 
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
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                  />
                  <button 
                    onClick={saveWebhook}
                    style={{ background: 'var(--primary)', border: 'none', borderRadius: '4px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                  >
                    <Check size={16} />
                  </button>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.5rem 0' }} />

                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem' }}>SAUVEGARDE DES DONNÉES</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
                  Vos données sont stockées localement sur ce navigateur. Pensez à exporter régulièrement une sauvegarde (fichier .json) et conservez-la précieusement !
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button onClick={handleExportData} className="btn" style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(78, 222, 163, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Download size={16} style={{ marginRight: '6px' }} /> Exporter
                  </button>
                  <button onClick={() => fileInputRef.current.click()} className="btn" style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(255, 180, 171, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={16} style={{ marginRight: '6px' }} /> Importer
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".json" 
                    onChange={handleImportData}
                  />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.5rem 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {user ? (
                      <>Connecté en tant que : <br/><strong style={{ color: 'var(--text-main)' }}>{user.email}</strong></>
                    ) : (
                      <>Mode : <strong style={{ color: 'var(--text-main)' }}>Invité (Local)</strong></>
                    )}
                  </div>
                  <button onClick={handleLogout} className="btn" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-light)', padding: '0.75rem', gap: '0.75rem' }}>
                    <LogOut size={16} />
                    {user ? "Se déconnecter" : "Quitter le mode local"}
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
