import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, Box, Info, Wind, Zap, Plug, Link as LinkIcon } from 'lucide-react';
import { calculateDailyCost, formatCurrency } from '../utils/costCalculator';

export function Terrariums() {
  const { terrariums, setTerrariums, equipments, setEquipments, animals, settings } = useAppContext();
  
  const handleAdd = () => {
    const newId = crypto.randomUUID();
    setTerrariums([{
      id: newId,
      name: 'Nouvel Habitat',
      dimensions: '',
      brand: '',
      notes: ''
    }, ...terrariums]);
  };

  const handleDelete = (id) => {
    if(window.confirm("Supprimer ce terrarium ? (Les animaux assignés perdront leur habitat)")) {
      setTerrariums(terrariums.filter(t => t.id !== id));
      // Détacher les équipements
      setEquipments(equipments.map(e => e.terrariumId === id ? { ...e, terrariumId: '' } : e));
    }
  };

  const updateTerrarium = (id, field, value) => {
    setTerrariums(terrariums.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const associateEquipment = (terrariumId, eqId) => {
    if (!eqId) return;
    setEquipments(equipments.map(e => e.id === eqId ? { ...e, terrariumId } : e));
  };

  const detachEquipment = (eqId) => {
    setEquipments(equipments.map(e => e.id === eqId ? { ...e, terrariumId: '' } : e));
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Espaces</p>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Habitats</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vos terrariums, caractéristiques et matériels liés.</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Créer un habitat
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
        {terrariums.length === 0 && (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Aucun terrarium configuré pour le moment.</p>
          </div>
        )}
        
        {terrariums.map(t => {
          const tAnimals = animals.filter(a => a.terrariumId === t.id);
          const tEquipments = equipments.filter(e => e.terrariumId === t.id);
          const availableEquipments = equipments.filter(e => e.terrariumId !== t.id);
          
          const totalDailyCost = tEquipments.reduce((sum, current) => {
            return sum + calculateDailyCost(current.watts, current.hoursPerDay, settings.kwhPrice);
          }, 0);
 
          return (
            <div key={t.id} className="glass-panel" style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', position: 'relative', padding: '2rem' }}>
              <div style={{ flex: '1.2', minWidth: '350px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: 'rgba(78, 222, 163, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Box size={24} color="var(--primary)" />
                  </div>
                  <input 
                    type="text" 
                    value={t.name || ''} 
                    onChange={(e) => updateTerrarium(t.id, 'name', e.target.value)}
                    style={{ fontSize: '1.8rem', fontWeight: 800, background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', border: '1px solid var(--border-light)', borderRadius: '8px', color: '#fff', width: '100%' }}
                    placeholder="Nom de l'habitat (ex: T19)"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <label>Marque Habitat</label>
                    <div style={{ position: 'relative' }}>
                      <Info size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--secondary)' }} />
                      <select 
                        value={['Abistat', 'Herptek', 'Terra-plantis', 'Komodo'].includes(t.brand) ? t.brand : (t.brand ? 'custom' : '')} 
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            const custom = window.prompt("Saisir la marque du terrarium :");
                            updateTerrarium(t.id, 'brand', custom || '');
                          } else {
                            updateTerrarium(t.id, 'brand', e.target.value);
                          }
                        }}
                        style={{ paddingLeft: '2.75rem' }}
                      >
                        <option value="">-- Sélectionner --</option>
                        <option value="Abistat">Abistat</option>
                        <option value="Herptek">Herptek</option>
                        <option value="Terra-plantis">Terra-plantis</option>
                        <option value="Komodo">Komodo</option>
                        <option value="custom">Autre (Saisir...)</option>
                      </select>
                      {t.brand && !['Abistat', 'Herptek', 'Terra-plantis', 'Komodo'].includes(t.brand) && (
                        <p style={{ position: 'absolute', bottom: '-1.5rem', left: 0, fontSize: '0.7rem', color: 'var(--primary)' }}>Saisie libre : {t.brand}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label>Dimensions (LxPxH)</label>
                    <div style={{ position: 'relative' }}>
                      <Wind size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--primary)' }} />
                      <input 
                        type="text" 
                        value={t.dimensions || ''} 
                        onChange={(e) => updateTerrarium(t.id, 'dimensions', e.target.value)}
                        placeholder="Ex: 45x45x60 cm"
                        style={{ paddingLeft: '2.75rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section Equipements */}
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                    <Plug size={18} color="var(--primary)" /> Matériel assigné à cet habitat
                  </h4>
                  
                  {tEquipments.length > 0 ? (
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {tEquipments.map(eq => (
                         <li key={eq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                           <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{eq.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>({eq.watts}W)</span></span>
                           <button 
                             onClick={() => detachEquipment(eq.id)}
                             title="Détacher de ce terrarium"
                             style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                           >
                             <Trash2 size={16} />
                           </button>
                         </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>Aucun matériel branché actuellement.</p>
                  )}

                  {availableEquipments.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <select 
                        onChange={(e) => {
                          associateEquipment(t.id, e.target.value);
                          e.target.value = ""; // reset
                        }}
                        style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                        defaultValue=""
                      >
                        <option value="" disabled>Associer un matériel existant...</option>
                        {availableEquipments.map(eq => (
                          <option key={eq.id} value={eq.id}>{eq.name} ({eq.watts}W)</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
              </div>

              <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(9, 15, 21, 0.4)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Population ({tAnimals.length})</h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tAnimals.length === 0 ? (
                      <li style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Habitat inoccupé</li>
                    ) : tAnimals.map(a => (
                      <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{a.commonName} <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>{a.nickname ? `"${a.nickname}"` : ''}</span></span>
                        <div style={{ height: '8px', width: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'rgba(9, 15, 21, 0.4)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                   <h4 style={{ marginBottom: '1rem', color: 'var(--secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estimation Énergétique</h4>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(173, 198, 255, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                        <Zap size={24} color="var(--secondary)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(totalDailyCost)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ j</span></div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Coût généré par {tEquipments.length} équipements</p>
                      </div>
                   </div>
                </div>

                <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                  <button className="btn" onClick={() => handleDelete(t.id)} style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(255, 180, 171, 0.2)', fontSize: '0.8rem' }}>
                    <Trash2 size={16} /> Supprimer l'habitat
                  </button>
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  );
}
