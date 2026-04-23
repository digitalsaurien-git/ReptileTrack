import { useState, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Home, Plug, Settings, Sun, Moon, Euro, X, Check, Drumstick, Download, Upload, LogOut, Smartphone, RefreshCw, Globe } from "lucide-react";
import { Snake } from "./icons/Snake";
import { SpeciesManager } from "./SpeciesManager";
import { useAppContext } from "../store/AppContext";
import { saveToDrive, loadFromDrive } from "../utils/googleDrive";
import "./Layout.css";

export function Layout() {
  const { 
    theme, toggleTheme, signOut, user, isGuest, setIsGuest, 
    exportData, importData, googleSyncEnabled, setGoogleSyncEnabled, connectGoogleDrive, 
    googleDriveReady, lastSync, setLastSync,
    animals, terrariums, equipments, foods, domotics, settings,
    saveWebhookUrl, cloudStatus, pushLocalToCloud, pullCloudToLocal
  } = useAppContext();

  const [showSettings, setShowSettings] = useState(false);
  const [showSpeciesManager, setShowSpeciesManager] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('reptiltrack_webhook_url') || '');

  const saveWebhook = () => {
    saveWebhookUrl(webhookUrl);
    setShowSettings(false);
  };


  const fileInputRef = useRef(null);

  const handleLogout = () => {
    // Nettoyage radical immédiat
    localStorage.removeItem('reptiltrack_is_guest');
    signOut();
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      importData(e.target.result);
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
      <nav className="sidebar glass-panel">
        <div className="logo">
          <Snake color="var(--primary)" size={32} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
            <h2 style={{ margin: 0 }}>ReptileTrack</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, opacity: 0.9 }}>v2.9.1</span>
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

        <div className="sidebar-footer">
          <div style={{ position: 'relative' }}>
             <button 
                className="settings-btn"
                onClick={() => setShowSpeciesManager(true)}
                style={{ marginBottom: '0.5rem' }}
              >
                <Globe size={20} />
                <span>Catalogue</span>
             </button>

             {showSettings && (
               <div className="glass-panel" style={{ 
                 position: 'absolute', 
                 bottom: '110%', 
                 left: 0, 
                 width: '320px', 
                 padding: '1.5rem',
                 zIndex: 1100,
                 boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                 border: '1px solid var(--border-light)'
               }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                   <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}>PARAMÈTRES</h4>
                   <X size={16} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setShowSettings(false)} />
                 </div>
                 
                 <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-muted)' }}>URL du Webhook (Make)</label>
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
                 </div>

                 <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem' }}>CLOUD & SAUVEGARDE</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button onClick={exportData} className="btn" style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
                        <Download size={16} style={{ marginRight: '6px' }} /> Exporter
                      </button>
                      <button onClick={() => fileInputRef.current.click()} className="btn" style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
                        <Upload size={16} style={{ marginRight: '6px' }} /> Importer
                      </button>
                    </div>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImportData} />
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                     {user ? (
                       <>Connecté : <strong style={{ color: 'var(--text-main)' }}>{user.email}</strong></>
                     ) : (
                       <>Mode : <strong style={{ color: 'var(--text-main)' }}>Invité (Local)</strong></>
                     )}
                   </div>
                   <button onClick={handleLogout} className="btn" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-light)', padding: '0.6rem', fontSize: '0.8rem' }}>
                     <LogOut size={14} style={{ marginRight: '0.5rem' }} />
                     Déconnexion
                   </button>
                 </div>
               </div>
             )}

             <button 
                className={`settings-btn ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings size={20} />
                <span>Paramètres</span>
             </button>
          </div>

          <div className="theme-toggle" style={{ margin: '0 1.25rem' }}>
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
        </div>
      </nav>

      {showSpeciesManager && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 1999 }}
          onClick={() => setShowSpeciesManager(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <SpeciesManager onClose={() => setShowSpeciesManager(false)} />
          </div>
        </div>
      )}

      <main className="main-content animate-fade-in">
        {user && !isGuest && cloudStatus !== 'synced' && cloudStatus !== 'idle' && (
          <div className="glass-panel" style={{ 
            marginBottom: '2rem', 
            padding: '1.25rem 2rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            border: '1px solid var(--primary-glow)',
            background: 'rgba(78, 222, 163, 0.05)',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <RefreshCw size={20} className={cloudStatus === 'loading' ? 'rotating' : ''} color="var(--primary)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {cloudStatus === 'sync_needed' && "☁️ Sauvegarde Cloud disponible"}
                  {cloudStatus === 'conflict' && "⚠️ Différence détectée avec le Cloud"}
                  {cloudStatus === 'checking' && "🔍 Vérification du Cloud..."}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {cloudStatus === 'sync_needed' && "Vos données locales peuvent être sauvegardées sur Digital Saurien."}
                  {cloudStatus === 'conflict' && "Souhaitez-vous garder votre version locale ou récupérer celle du Cloud ?"}
                  {cloudStatus === 'checking' && "Nous comparons vos données locales avec Digital Saurien."}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {cloudStatus === 'sync_needed' && (
                <button onClick={pushLocalToCloud} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Synchroniser vers le Cloud
                </button>
              )}
              {cloudStatus === 'conflict' && (
                <>
                  <button onClick={pushLocalToCloud} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'var(--primary)' }}>
                    Garder Local
                  </button>
                  <button onClick={pullCloudToLocal} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Récupérer Cloud
                  </button>
                </>
              )}
            </div>
          </div>
        )}
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
