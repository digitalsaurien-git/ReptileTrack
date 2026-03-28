import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, Plug, Zap, Euro, Clock, Activity, Copy, Tag, Calendar } from 'lucide-react';
import { calculateDailyCost, formatCurrency } from '../utils/costCalculator';

const equipmentBrands = [
  'Habistat',
  'Terratlantis',
  'Exo Terra',
  'Arcadia',
  'Zoo Med',
  'Reptile Systems',
  'Herptek',
  'Trixie',
  'Lucky Reptile',
  'Pangea',
  'Repashy'
];

export function Equipments() {
  const { settings, setSettings, equipments, setEquipments, terrariums } = useAppContext();
  
  const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

  const handleAdd = () => {
    const newId = generateId();
    setEquipments([{
      id: newId,
      name: 'Equipement (Modèle)',
      brand: '',
      type: 'lampe_chauffante',
      watts: 50,
      hoursPerDay: 12,
      purchasePrice: 0,
      salePrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      replacementFreq: 6, // mois par défaut
      terrariumId: '',
      serialNumber: ''
    }, ...equipments]);
  };

  const handleDuplicate = (eq) => {
    const newId = generateId();
    setEquipments([{
      ...eq,
      id: newId,
      name: `${eq.name} (Copie)`,
      terrariumId: '' // Ne pas lier au même terrarium par défaut
    }, ...equipments]);
  };

  const handleBulkDuplicate = (eq) => {
    const countStr = window.prompt(`Combien de copies de "${eq.name}" souhaitez-vous créer ?`, "5");
    const count = parseInt(countStr);
    if (isNaN(count) || count <= 0) return;
    
    if (count > 50) {
      alert("La duplication est limitée à 50 exemplaires simultanés.");
      return;
    }

    const newCopies = Array.from({ length: count }, (_, i) => ({
      ...eq,
      id: generateId(),
      name: `${eq.name} (Lot ${i + 1})`,
      terrariumId: '',
      serialNumber: `${eq.serialNumber || 'SN'}-${i + 1}`
    }));

    setEquipments([...newCopies, ...equipments]);
  };

  const handleDelete = (id) => {
    if(window.confirm("Supprimer cet équipement ?")) {
      setEquipments(equipments.filter(e => e.id !== id));
    }
  };

  const updateEquipment = (id, field, value) => {
    setEquipments(equipments.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const totalCost = equipments.reduce((sum, e) => sum + calculateDailyCost(e.watts, e.hoursPerDay, settings.kwhPrice), 0);

  const equipementTypes = [
    { value: 'lampe_chauffante', label: 'Lampe Chauffante' },
    { value: 'tapis_chauffant', label: 'Tapis Chauffant' },
    { value: 'lampe_uvb', label: 'Éclairage UVB' },
    { value: 'lampe_led', label: 'Éclairage LED' },
    { value: 'thermostat', label: 'Thermostat' },
    { value: 'brumisateur', label: 'Brumisateur / Système de pluie' },
    { value: 'autre', label: 'Autre équipement' }
  ];

  // Grouping logic
  const groupedEquipments = equipments.reduce((groups, eq) => {
    const typeLabel = equipementTypes.find(t => t.value === eq.type)?.label || 'Autre';
    if (!groups[typeLabel]) groups[typeLabel] = [];
    groups[typeLabel].push(eq);
    return groups;
  }, {});

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Maintenance</p>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Matériel & Coûts</h1>
          <p style={{ color: 'var(--text-muted)' }}>Optimisez vos dépenses énergétiques et gérez votre parc d'équipements.</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Ajouter du matériel
        </button>
      </header>
      
      <div className="glass-panel" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem', padding: '2.5rem' }}>
        <div style={{ flex: '1.2', minWidth: '300px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', marginBottom: '1rem' }}>
            <Zap size={24} color="var(--primary)" /> Paramètres Énergétiques
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Ajustez le prix du KWh pour obtenir une estimation précise de vos coûts d'entretien.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Prix du KWh (€) :</label>
            <div style={{ position: 'relative', width: '200px' }}>
              <Euro size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--primary)' }} />
              <input 
                type="number" 
                step="0.01" 
                value={settings.kwhPrice} 
                onChange={(e) => setSettings({ ...settings, kwhPrice: parseFloat(e.target.value) || 0 })}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>
        </div>
        
        <div style={{ flex: '1', minWidth: '280px', background: 'rgba(9, 15, 21, 0.4)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 700 }}>Coût Journalier Global</p>
          <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>{formatCurrency(totalCost)}</p>
          <div style={{ display: 'inline-flex', padding: '0.4rem 1rem', background: 'rgba(78, 222, 163, 0.1)', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
            {formatCurrency(totalCost * 30.416)} / mois
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {equipments.length === 0 && (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Aucun équipement enregistré dans la base.</p>
          </div>
        )}
        
        {Object.entries(groupedEquipments).map(([typeLabel, items]) => (
          <section key={typeLabel}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', color: 'var(--primary)' }}>
              <Tag size={18} /> {typeLabel} ({items.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
              {items.map(eq => (
                <div key={eq.id} className="glass-card" style={{ cursor: 'default', padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div style={{ background: 'rgba(78, 222, 163, 0.1)', padding: '0.6rem', borderRadius: '10px', position: 'relative' }}>
                        <Plug size={20} color="var(--primary)" />
                        {(() => {
                           const nextDate = eq.purchaseDate ? new Date(new Date(eq.purchaseDate).setMonth(new Date(eq.purchaseDate).getMonth() + (eq.replacementFreq || 6))) : null;
                           const isDue = nextDate && nextDate < new Date();
                           return isDue ? (
                             <div title="Maintenance requise !" style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', borderRadius: '50%', width: '12px', height: '12px', border: '1px solid #fff' }}></div>
                           ) : null;
                        })()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input 
                            list={`brand-list-${eq.id}`}
                            type="text" 
                            value={eq.brand || ''} 
                            placeholder="Marque (Ex: Habistat)"
                            onChange={e => updateEquipment(eq.id, 'brand', e.target.value)}
                            style={{ background: 'rgba(5, 150, 105, 0.05)', border: '1px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', width: '40%', fontWeight: 700, textTransform: 'uppercase' }}
                          />
                          <datalist id={`brand-list-${eq.id}`}>
                            {equipmentBrands.map(b => <option key={b} value={b} />)}
                          </datalist>
                          <input 
                            type="text" 
                            value={eq.name} 
                            placeholder="Ex: Sun Ray 70W"
                            onChange={e => updateEquipment(eq.id, 'name', e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', fontWeight: 600, fontSize: '0.95rem', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '4px', flex: 1 }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={eq.serialNumber || ''} 
                            placeholder="Identifiant / N° de Série"
                            onChange={e => updateEquipment(eq.id, 'serialNumber', e.target.value)}
                            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem', width: '150px' }}
                          />
                          <span style={{ fontSize: '0.65rem', background: 'rgba(78, 222, 163, 0.1)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                            {equipementTypes.find(t => t.value === eq.type)?.label || 'Équipement'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        onClick={() => handleDuplicate(eq)} 
                        title="Dupliquer"
                        aria-label="Dupliquer l'équipement"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', padding: '0.4rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', cursor: 'pointer' }}
                      >
                        <Copy size={18} />
                      </button>
                      <button 
                        onClick={() => handleBulkDuplicate(eq)} 
                        title="Duplication en masse"
                        aria-label="Dupliquer en masse"
                        style={{ background: 'rgba(173, 198, 255, 0.1)', borderRadius: '6px', padding: '0.4rem', border: '1px solid var(--border-light)', color: 'var(--secondary)', cursor: 'pointer' }}
                      >
                        <Plus size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(eq.id)} 
                        title="Supprimer"
                        aria-label="Supprimer l'équipement"
                        style={{ background: 'rgba(255, 180, 171, 0.05)', borderRadius: '6px', padding: '0.4rem', border: '1px solid var(--border-light)', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                     <label>Type d'équipement</label>
                     <div style={{ position: 'relative' }}>
                       <Tag size={14} style={{ position: 'absolute', left: '0.75rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                       <select 
                         value={eq.type || 'lampe_chauffante'} 
                         onChange={e => updateEquipment(eq.id, 'type', e.target.value)}
                         style={{ paddingLeft: '2.2rem' }}
                       >
                         {equipementTypes.map(type => (
                           <option key={type.value} value={type.value}>{type.label}</option>
                         ))}
                       </select>
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label>Prix d'Achat (€)</label>
                      <div style={{ position: 'relative' }}>
                         <Euro size={14} style={{ position: 'absolute', left: '0.75rem', top: '1.1rem', color: 'var(--primary)', opacity: 0.6 }} />
                         <input 
                          type="number" 
                          value={eq.purchasePrice || 0} 
                          onChange={e => updateEquipment(eq.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          style={{ paddingLeft: '2.2rem' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label>Date Installation</label>
                      <div style={{ position: 'relative' }}>
                         <Calendar size={14} style={{ position: 'absolute', left: '0.75rem', top: '1.1rem', color: 'var(--secondary)', opacity: 0.6 }} />
                         <input 
                          type="date" 
                          value={eq.purchaseDate || ''} 
                          onChange={e => updateEquipment(eq.id, 'purchaseDate', e.target.value)}
                          style={{ paddingLeft: '2.2rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label>Fréquence de changement (Mois)</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        value={eq.replacementFreq || 6} 
                        onChange={e => updateEquipment(eq.id, 'replacementFreq', parseInt(e.target.value) || 0)}
                        style={{ width: '80px' }}
                      />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        🕒 Prochain changement : <strong>
                          {eq.purchaseDate ? 
                            new Date(new Date(eq.purchaseDate).setMonth(new Date(eq.purchaseDate).getMonth() + (eq.replacementFreq || 6))).toLocaleDateString() 
                            : 'Non définie'
                          }
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label>Puissance (Watts)</label>
                      <div style={{ position: 'relative' }}>
                         <Activity size={14} style={{ position: 'absolute', left: '0.75rem', top: '1.1rem', color: 'var(--primary)', opacity: 0.6 }} />
                         <input 
                          type="number" 
                          value={eq.watts} 
                          onChange={e => updateEquipment(eq.id, 'watts', parseInt(e.target.value) || 0)}
                          style={{ paddingLeft: '2.2rem' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label>Utilisation (H/Jour)</label>
                      <div style={{ position: 'relative' }}>
                         <Clock size={14} style={{ position: 'absolute', left: '0.75rem', top: '1.1rem', color: 'var(--secondary)', opacity: 0.6 }} />
                         <input 
                          type="number" 
                          value={eq.hoursPerDay} 
                          max="24"
                          onChange={e => updateEquipment(eq.id, 'hoursPerDay', parseInt(e.target.value) || 0)}
                          style={{ paddingLeft: '2.2rem' }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <label>Assigné à l'Habitat</label>
                    <select 
                      value={eq.terrariumId || ''} 
                      onChange={e => updateEquipment(eq.id, 'terrariumId', e.target.value)}
                    >
                      <option value="">-- Non branché --</option>
                      {terrariums && terrariums.length > 0 ? (
                        terrariums.map(t => (
                          <option key={t.id} value={t.id}>{t.name || `Habitat ${t.id.substring(0,4)}`} {t.brand ? `(${t.brand})` : ''}</option>
                        ))
                      ) : (
                        <option disabled>Aucun habitat configuré</option>
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(9, 15, 21, 0.5)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Estimation journalière</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                      {formatCurrency(calculateDailyCost(eq.watts, eq.hoursPerDay, settings.kwhPrice))}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

