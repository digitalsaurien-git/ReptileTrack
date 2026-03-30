import { useState } from "react";
import { useAppContext } from "../store/AppContext";
import { Smartphone, Plus, Power, Thermometer, RefreshCw, Trash2, Settings2, Info } from "lucide-react";

export function Domotics() {
  const { domotics, setDomotics, terrariums, theme } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ 
    name: "", 
    type: "plug", 
    provider: "switchbot", 
    deviceId: "",
    terrariumIds: [] 
  });

  const deviceTypes = [
    { id: 'plug', label: 'Prise Connectée', icon: <Power size={20} /> },
    { id: 'sensor', label: 'Capteur Temp/Hum', icon: <Thermometer size={20} /> },
  ];

  const providers = [
    { id: 'switchbot', label: 'SwitchBot' },
    { id: 'tapo', label: 'Tapo (TP-Link)' },
    { id: 'shelly', label: 'Shelly' },
  ];

  const handleAddDevice = (e) => {
    e.preventDefault();
    const device = {
      ...newDevice,
      id: Date.now().toString(),
      status: newDevice.type === 'plug' ? 'off' : 'active',
      lastUpdate: new Date().toISOString(),
      value: newDevice.type === 'sensor' ? '24.5°C' : null
    };
    setDomotics([...domotics, device]);
    setShowAddModal(false);
    setNewDevice({ name: "", type: "plug", provider: "switchbot", deviceId: "", terrariumIds: [] });
  };

  const togglePlug = (id) => {
    setDomotics(domotics.map(d => {
      if (d.id === id && d.type === 'plug') {
        return { ...d, status: d.status === 'on' ? 'off' : 'on', lastUpdate: new Date().toISOString() };
      }
      return d;
    }));
  };

  const deleteDevice = (id) => {
    if (confirm("Supprimer cet appareil ?")) {
      setDomotics(domotics.filter(d => d.id !== id));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Smartphone size={32} color="var(--primary)" />
            Domotique
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Contrôlez et surveillez vos équipements connectés en temps réel.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Ajouter un appareil
        </button>
      </div>

      {!domotics || domotics.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ opacity: 0.3, marginBottom: '1.5rem' }}>
            <Smartphone size={64} />
          </div>
          <h3>Aucun appareil connecté</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto 2rem' }}>
            Connectez vos prises SwitchBot, Shelly ou vos capteurs de température pour automatiser votre élevage.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Commencer l'installation
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {domotics.map(device => {
            const selectedTerras = terrariums.filter(t => device.terrariumIds?.includes(t.id));
            const isPlug = device.type === 'plug';
            const isOn = device.status === 'on';

            return (
              <div key={device.id} className="glass-panel" style={{ 
                padding: '1.5rem',
                borderLeft: `4px solid ${isOn ? 'var(--primary)' : 'var(--border-light)'}`,
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '10px', 
                      background: isOn ? 'rgba(78, 222, 163, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOn ? 'var(--primary)' : 'inherit'
                    }}>
                      {device.type === 'plug' ? <Power size={20} /> : <Thermometer size={20} />}
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{device.name}</h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem' }}>
                        <span>{providers.find(p => p.id === device.provider)?.label}</span>
                        {selectedTerras.length > 0 && (
                          <>
                            <span>•</span>
                            {selectedTerras.map((t, idx) => (
                              <span key={t.id}>{t.name}{idx < selectedTerras.length - 1 ? ',' : ''}</span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="theme-btn" style={{ padding: '0.4rem' }} onClick={() => deleteDevice(device.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(0,0,0,0.1)', 
                  borderRadius: '12px', 
                  padding: '1rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</div>
                    <div style={{ fontWeight: '600', color: isOn ? 'var(--primary)' : 'var(--text-main)' }}>
                      {isPlug ? (isOn ? 'ALLUMÉ' : 'ÉTEINT') : device.value}
                    </div>
                  </div>
                  {isPlug && (
                    <button 
                      onClick={() => togglePlug(device.id)}
                      style={{
                        width: '50px',
                        height: '26px',
                        borderRadius: '13px',
                        background: isOn ? 'var(--primary)' : 'var(--border-light)',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '3px',
                        left: isOn ? '27px' : '3px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <RefreshCw size={10} className={isOn && isPlug ? "animate-spin" : ""} />
                    Mis à jour {new Date(device.lastUpdate).toLocaleTimeString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Info size={10} />
                    ID: {device.deviceId.substring(0, 8)}...
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>Ajouter un équipement</h2>
              <X size={24} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleAddDevice}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Nom de l'appareil</label>
                <input 
                  type="text" 
                  required 
                  value={newDevice.name}
                  onChange={e => setNewDevice({...newDevice, name: e.target.value})}
                  placeholder="ex: Lampe Chauffante Python" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={newDevice.type}
                    onChange={e => setNewDevice({...newDevice, type: e.target.value})}
                  >
                    {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Constructeur</label>
                  <select 
                    value={newDevice.provider}
                    onChange={e => setNewDevice({...newDevice, provider: e.target.value})}
                  >
                    {providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>ID de l'appareil (Device ID Cloud)</label>
                <input 
                  type="text" 
                  required 
                  value={newDevice.deviceId}
                  onChange={e => setNewDevice({...newDevice, deviceId: e.target.value})}
                  placeholder="ex: ABC-123-XYZ" 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Terrariums associés</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.5rem', 
                  maxHeight: '120px', 
                  overflowY: 'auto',
                  padding: '0.5rem',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '8px'
                }}>
                  {terrariums.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={newDevice.terrariumIds?.includes(t.id)}
                        onChange={(e) => {
                          const ids = newDevice.terrariumIds || [];
                          if (e.target.checked) {
                            setNewDevice({...newDevice, terrariumIds: [...ids, t.id]});
                          } else {
                            setNewDevice({...newDevice, terrariumIds: ids.filter(id => id !== t.id)});
                          }
                        }}
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Enregistrer l'appareil</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal X component for the modal if not imported
const X = ({ size, style, onClick }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={style}
    onClick={onClick}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
