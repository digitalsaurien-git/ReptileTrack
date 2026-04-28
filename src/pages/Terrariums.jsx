import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, Home, Info, Wind, Zap, Plug, Euro, Link as LinkIcon } from 'lucide-react';
import { calculateDailyCost, formatCurrency } from '../utils/costCalculator';
import { sortAlphabetically } from '../utils/sortingUtils';

const brands = [
  'Exo Terra',
  'Habistat',
  'Herptek',
  'PVC (Sur mesure)',
  'Reptile Systems',
  'Terratlantis',
  'Verre (Standard)',
  'Zoo Med'
];

const defaultDimensions = [
  '145 x 45 x 60',
  '60 x 50 x 35',
  '60 x 50 x 50',
  '90 x 60 x 50',
  '120 x 70 x 50'
];

export function Terrariums() {
  const { terrariums, setTerrariums, equipments, setEquipments, animals, settings } = useAppContext();
  const [selectedId, setSelectedId] = useState(null);
  
  const handleAdd = () => {
    const newId = crypto.randomUUID();
    setTerrariums([{
      id: newId,
      name: 'Hab. ' + (terrariums.length + 1),
      dimensions: '',
      brand: '',
      purchasePrice: 0,
      salePrice: 0,
      notes: ''
    }, ...terrariums]);
    setSelectedId(newId);
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

  const renderList = () => (
    <>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(78, 222, 163, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
            <Home size={32} color="var(--primary)" />
          </div>
          <div>
            <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Espaces</p>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>Habitats</h1>
            <p style={{ color: 'var(--text-muted)' }}>{terrariums.length} terrariums configurés.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Créer un habitat
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {sortAlphabetically(terrariums, t => t.name).map(t => {
          const tAnimals = animals.filter(a => a.terrariumId === t.id);
          const tEquipments = equipments.filter(e => e.terrariumId === t.id);
          return (
            <div 
              key={t.id} 
              className="glass-card" 
              onClick={() => setSelectedId(t.id)}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(78, 222, 163, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                  <Home size={20} color="var(--primary)" />
                </div>
                {tAnimals.length > 0 && (
                  <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.65rem' }}>
                    {tAnimals.length} occupant(s)
                  </span>
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', textTransform: 'uppercase' }}>{t.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.dimensions || 'Dimensions NC'}</p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                {tEquipments.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>{tEquipments.length} équipements</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderDetail = () => {
    const t = terrariums.find(terr => terr.id === selectedId);
    if (!t) return setSelectedId(null);

    const tAnimals = sortAlphabetically(animals.filter(a => a.terrariumId === t.id), a => a.nickname || a.commonName || '');
    const tEquipments = equipments.filter(e => e.terrariumId === t.id);
    const availableEquipments = sortAlphabetically(equipments.filter(e => e.terrariumId !== t.id), e => e.name);
    
    const totalDailyCost = tEquipments.reduce((sum, current) => {
      return sum + calculateDailyCost(current.watts, current.hoursPerDay, settings.kwhPrice);
    }, 0);

    // Normalisation et déduplication des dimensions
    const normalize = (s) => {
      if (!s) return '';
      const res = s.split(/[x×*]/).map(v => v.toString().trim().replace(/[^0-9]/g, ''));
      const l = res[0] || '0';
      const p = res[1] || '0';
      const h = res[2] || '0';
      return `${l} x ${p} x ${h}`;
    };

    const existingDimensions = terrariums.map(terr => normalize(terr.dimensions)).filter(Boolean);
    const allDimensions = Array.from(new Set([...defaultDimensions.map(normalize), ...existingDimensions]))
      .sort((a, b) => {
        const parse = (s) => s.split(' x ').map(v => parseInt(v) || 0);
        const [l1, p1, h1] = parse(a);
        const [l2, p2, h2] = parse(b);
        if (l1 !== l2) return l1 - l2;
        if (p1 !== p2) return p1 - p2;
        return h1 - h2;
      });

    // Helper pour parser les dimensions actuelles du terrarium
    const currentDimParts = (t.dimensions || '').split(/[x×*]/).map(s => s.toString().trim().replace(/[^0-9]/g, ''));
    const dimL = currentDimParts[0] || '';
    const dimP = currentDimParts[1] || '';
    const dimH = currentDimParts[2] || '';

    const handleDimChange = (field, value) => {
      const parts = [dimL, dimP, dimH];
      if (field === 'L') parts[0] = value;
      if (field === 'P') parts[1] = value;
      if (field === 'H') parts[2] = value;
      updateTerrarium(t.id, 'dimensions', parts.join(' x '));
    };

    return (
      <div className="animate-fade-in">
        <button 
          className="btn btn-secondary" 
          onClick={() => setSelectedId(null)}
          style={{ marginBottom: '2rem', padding: '0.5rem 1rem' }}
        >
          ← Retour à la liste
        </button>

        <div className="glass-panel" style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', position: 'relative', padding: '2rem' }}>
          <div style={{ flex: '1.2', minWidth: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(78, 222, 163, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                <Home size={24} color="var(--primary)" />
              </div>
              <input 
                type="text" 
                value={t.name || ''} 
                onChange={(e) => updateTerrarium(t.id, 'name', e.target.value)}
                style={{ fontSize: '1.8rem', fontWeight: 800, background: 'var(--bg-panel-secondary)', padding: '0.5rem 1rem', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', width: '100%' }}
                placeholder="Nom de l'habitat (ex: T19)"
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label>Marque Habitat</label>
                <div style={{ position: 'relative' }}>
                  <Info size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--secondary)' }} />
                  <select 
                    value={brands.includes(t.brand) ? t.brand : (t.brand ? 'custom' : '')} 
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
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="custom">Autre (Saisir...)</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Dimensions (LxPxH)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Wind size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--primary)' }} />
                    <select 
                      value={allDimensions.includes(normalize(t.dimensions)) ? normalize(t.dimensions) : ""} 
                      onChange={(e) => updateTerrarium(t.id, 'dimensions', e.target.value)}
                      style={{ paddingLeft: '2.75rem' }}
                    >
                      <option value="">-- Format libre --</option>
                      {allDimensions.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      value={dimL} 
                      onChange={(e) => handleDimChange('L', e.target.value)}
                      placeholder="Long."
                      style={{ textAlign: 'center', padding: '0.6rem 0.2rem' }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>×</span>
                    <input 
                      type="number" 
                      value={dimP} 
                      onChange={(e) => handleDimChange('P', e.target.value)}
                      placeholder="Prof."
                      style={{ textAlign: 'center', padding: '0.6rem 0.2rem' }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>×</span>
                    <input 
                      type="number" 
                      value={dimH} 
                      onChange={(e) => handleDimChange('H', e.target.value)}
                      placeholder="Haut."
                      style={{ textAlign: 'center', padding: '0.6rem 0.2rem' }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label>Prix d'Achat (€)</label>
                <div style={{ position: 'relative' }}>
                  <Euro size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--primary)' }} />
                  <input 
                    type="number" 
                    value={t.purchasePrice || 0} 
                    onChange={(e) => updateTerrarium(t.id, 'purchasePrice', parseFloat(e.target.value))}
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>
              <div>
                <label>Prix de Vente (€)</label>
                <div style={{ position: 'relative' }}>
                  <Euro size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--secondary)' }} />
                  <input 
                    type="number" 
                    value={t.salePrice || 0} 
                    onChange={(e) => updateTerrarium(t.id, 'salePrice', parseFloat(e.target.value))}
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Section Equipements */}
            <div style={{ background: 'var(--bg-panel-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <Plug size={18} color="var(--primary)" /> Matériel branché
              </h4>
              
              {tEquipments.length > 0 ? (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {tEquipments.map(eq => {
                     const typeLabel = eq.type === 'lampe_chauffante' ? 'Lampe' : 
                                       eq.type === 'tapis_chauffant' ? 'Tapis' :
                                       eq.type === 'lampe_uvb' ? 'UVB' :
                                       eq.type === 'lampe_led' ? 'LED' :
                                       eq.type === 'thermostat' ? 'Th.' :
                                       eq.type === 'brumisateur' ? 'Pluie' : '';
                     return (
                       <li key={eq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                         <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                           <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 500, marginRight: '0.5rem' }}>[{typeLabel}]</span>
                           {eq.brand && <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginRight: '0.5rem' }}>{eq.brand}</span>}
                           {eq.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>({eq.watts}W)</span>
                         </span>
                         <button 
                           onClick={() => detachEquipment(eq.id)}
                           title="Détacher"
                           style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                         >
                           <Trash2 size={16} />
                         </button>
                       </li>
                     );
                  })}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>Aucun matériel associé.</p>
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
                    <option value="" disabled>Associer un matériel...</option>
                    {availableEquipments.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.watts}W)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
          </div>

          <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-panel-secondary)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
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

            <div style={{ background: 'var(--bg-panel-secondary)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
               <h4 style={{ marginBottom: '1rem', color: 'var(--secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estimation Énergétique</h4>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(173, 198, 255, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                    <Zap size={24} color="var(--secondary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(totalDailyCost)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ j</span></div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Coût de fonctionnement estimé</p>
                  </div>
               </div>
            </div>

            <div style={{ marginTop: 'auto', textAlign: 'right' }}>
              <button className="btn" onClick={() => { if(handleDelete(t.id)) setSelectedId(null); }} style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(255, 180, 171, 0.2)', fontSize: '0.8rem' }}>
                <Trash2 size={16} /> Supprimer l'habitat
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {selectedId ? renderDetail() : renderList()}
    </div>
  );
}
