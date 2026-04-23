import { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Drumstick, Trash2, Edit2, AlertTriangle, Euro, Calculator, Download, Settings, Snowflake } from 'lucide-react';
import { formatCurrency } from '../utils/costCalculator';

export function Foods() {
  const { foods, setFoods, animals, settings, setSettings } = useAppContext();
  const [activeSubTab, setActiveSubTab] = useState('stock'); // 'stock' | 'planner'
  const [editingId, setEditingId] = useState(null);
  
  // Local overrides for planner (not persisted in cloud in phase 1 as requested)
  const [plannerOverrides, setPlannerOverrides] = useState({});

  const [newFood, setNewFood] = useState({ 
    name: '', 
    unitPrice: 0.50, 
    stock: 0, 
    alertThreshold: 5,
    maxFreezer: 0
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newFood.name) return;
    
    if (editingId) {
      setFoods(foods.map(f => f.id === editingId ? { ...newFood, id: editingId } : f));
      setEditingId(null);
    } else {
      setFoods([{ ...newFood, id: crypto.randomUUID() }, ...foods]);
    }
    
    setNewFood({ name: '', unitPrice: 0.50, stock: 0, alertThreshold: 5, maxFreezer: 0 });
  };

  const handleEdit = (food) => {
    setNewFood(food);
    setEditingId(food.id);
  };

  const handleDelete = (id) => {
    if (window.confirm("Supprimer ce type de nourriture du stock ?")) {
      setFoods(foods.filter(f => f.id !== id));
    }
  };

  const updateField = (field, value) => {
    setNewFood(prev => ({ ...prev, [field]: value }));
  };

  const updateSetting = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // --- Logic Planificateur ---
  
  // 1. Filtrage animaux actifs
  const activeAnimals = useMemo(() => {
    return animals.filter(a => a.status === 'vivant' || a.status === 'malade' || !a.status);
  }, [animals]);

  // 2. Calcul des besoins par animal
  const animalNeeds = useMemo(() => {
    return activeAnimals.map(animal => {
      // Calcul du nombre par semaine par défaut : (7 / fréquence) * quantité
      const defaultPerWeek = animal.feedingFrequency ? (7 / animal.feedingFrequency) * (animal.defaultFoodQuantity || 1) : 0;
      const perWeek = plannerOverrides[animal.id]?.perWeek !== undefined ? plannerOverrides[animal.id].perWeek : defaultPerWeek;
      
      const food = foods.find(f => f.id === animal.defaultFoodId);
      
      return {
        id: animal.id,
        name: animal.nickname || animal.commonName,
        foodName: food ? food.name : 'Non défini',
        foodId: animal.defaultFoodId,
        perWeek: parseFloat(perWeek.toFixed(2)),
        total: perWeek * (settings.planner_duration || 13)
      };
    });
  }, [activeAnimals, foods, settings.planner_duration, plannerOverrides]);

  // 3. Consolidation Liste de courses
  const shoppingList = useMemo(() => {
    const list = {};
    
    animalNeeds.forEach(need => {
      if (!need.foodId) return;
      if (!list[need.foodId]) {
        const food = foods.find(f => f.id === need.foodId);
        list[need.foodId] = {
          foodId: need.foodId,
          name: food?.name || 'Inconnu',
          type: food?.type || 'Proie',
          nbAnimals: 0,
          neededTotal: 0,
          stock: food?.stock || 0,
          maxFreezer: food?.maxFreezer || 0,
          unitPrice: food?.unitPrice || 0
        };
      }
      list[need.foodId].nbAnimals += 1;
      list[need.foodId].neededTotal += need.total;
    });

    return Object.values(list).map(item => {
      const rawBuy = Math.max(0, item.neededTotal - item.stock);
      // Prise en compte du congélateur : on ne peut pas acheter plus que (Capacité - Stock actuel)
      const freezerSpace = item.maxFreezer > 0 ? Math.max(0, item.maxFreezer - item.stock) : 999999;
      const toBuy = Math.min(rawBuy, freezerSpace);
      
      const rounded = Math.ceil(toBuy); // Arrondi auto par défaut
      const subTotal = rounded * item.unitPrice;
      const vatAmount = subTotal * ((settings.planner_vat || 20) / 100);
      
      return {
        ...item,
        toBuy: parseFloat(toBuy.toFixed(2)),
        rounded,
        subTotal,
        vatAmount,
        total: subTotal + vatAmount
      };
    });
  }, [animalNeeds, foods, settings.planner_vat]);

  // Totaux globaux
  const globalTotals = useMemo(() => {
    const preySubtotalTTC = shoppingList.reduce((sum, item) => sum + item.total, 0);
    
    // Calcul Transport & Box (HT -> TTC)
    const vatRate = (settings.planner_vat || 20) / 100;
    const transportHT = settings.planner_transport || 0;
    const boxHT = settings.planner_box || 0;
    
    const transportTTC = transportHT * (1 + vatRate);
    const boxTTC = boxHT * (1 + vatRate);
    
    return {
      preyTTC: preySubtotalTTC,
      transportHT,
      transportTTC,
      boxHT,
      boxTTC,
      grandTotal: preySubtotalTTC + transportTTC + boxTTC
    };
  }, [shoppingList, settings.planner_transport, settings.planner_box, settings.planner_vat]);

  const handleExport = () => {
    const headers = ['Type', 'Animaux', 'Besoin 3 mois', 'Stock', 'Max Congelo', 'A acheter', 'Arrondi', 'Prix Unit', 'Total TTC'];
    const rows = shoppingList.map(item => [
      item.name,
      item.nbAnimals,
      item.neededTotal.toFixed(0),
      item.stock,
      item.maxFreezer || '∞',
      item.toBuy,
      item.rounded,
      item.unitPrice,
      item.total.toFixed(2)
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';')),
      '',
      `;;;;;;;Transport;${settings.planner_transport || 0}`,
      `;;;;;;;Boîte;${settings.planner_box || 0}`,
      `;;;;;;;TOTAL GLOBAL;${globalTotals.grandTotal.toFixed(2)}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Planificateur_Commande_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Nourriture & Logistique</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vos stocks et planifiez vos commandes futures.</p>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.4rem', borderRadius: 'var(--radius-md)', gap: '0.5rem', border: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setActiveSubTab('stock')}
            className={`btn ${activeSubTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
          >
            <Drumstick size={18} style={{ marginRight: '0.5rem' }} /> Inventaire
          </button>
          <button 
            onClick={() => setActiveSubTab('planner')}
            className={`btn ${activeSubTab === 'planner' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
          >
            <Calculator size={18} style={{ marginRight: '0.5rem' }} /> Planificateur
          </button>
        </div>
      </header>

      {activeSubTab === 'stock' ? (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
          {/* Formulaire d'ajout / édition */}
          <div className="glass-panel" style={{ height: 'fit-content', padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              {editingId ? <Edit2 size={24} color="var(--primary)" /> : <Plus size={24} color="var(--primary)" />}
              {editingId ? 'Modifier la Proie' : 'Nouvelle Proie'}
            </h2>
            
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label>Nom ou Type (ex: Souris 5-6g)</label>
                <input 
                  required
                  placeholder="Ex: Souris 5-6g"
                  value={newFood.name} 
                  onChange={e => updateField('name', e.target.value)} 
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Stock Actuel</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={newFood.stock} 
                    onChange={e => updateField('stock', parseInt(e.target.value))} 
                  />
                </div>
                <div>
                  <label>Seuil d'Alerte</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={newFood.alertThreshold} 
                    onChange={e => updateField('alertThreshold', parseInt(e.target.value))} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div>
                  <label>Prix Unitaire (€)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}><Euro size={16} /></span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      style={{ paddingLeft: '35px' }}
                      required
                      value={newFood.unitPrice} 
                      onChange={e => updateField('unitPrice', parseFloat(e.target.value))} 
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Snowflake size={14} /> Capacité Congélo</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newFood.maxFreezer || 0} 
                    onChange={e => updateField('maxFreezer', parseInt(e.target.value))} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Mettre à jour' : 'Ajouter au stock'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setNewFood({ name: '', unitPrice: 0.50, stock: 0, alertThreshold: 5, maxFreezer: 0 }); }}>
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Liste des aliments */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              <Drumstick size={24} color="var(--secondary)" /> Inventaire actuel
            </h2>

            {foods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Aucun type de nourriture configuré pour le moment.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {foods.map(food => {
                  const isAlert = food.stock <= food.alertThreshold;
                  return (
                    <div key={food.id} className="glass-card" style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem',
                      borderLeft: isAlert ? '4px solid var(--danger)' : '4px solid var(--primary)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{food.name}</h3>
                          {isAlert && <span className="badge" style={{ background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><AlertTriangle size={12} /> Stock Faible</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1.25rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Euro size={12} /> {formatCurrency(food.unitPrice)}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Snowflake size={12} /> Max: {food.maxFreezer || '∞'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isAlert ? 'var(--danger)' : 'var(--text-main)', lineHeight: 1 }}>
                            {food.stock}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            En stock
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary" onClick={() => handleEdit(food)} style={{ padding: '0.5rem' }} title="Modifier">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn" onClick={() => handleDelete(food.id)} style={{ padding: '0.5rem', background: 'var(--danger)', color: 'white' }} title="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: Réglages Globaux */}
          <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', padding: '1.5rem 2rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calculator size={14} /> Durée de commande (semaines)</label>
              <input 
                type="number" 
                value={settings.planner_duration} 
                onChange={e => updateSetting('planner_duration', parseInt(e.target.value))} 
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Euro size={14} /> Taux TVA (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={settings.planner_vat} 
                onChange={e => updateSetting('planner_vat', parseFloat(e.target.value))} 
              />
            </div>
            <div>
              <label>Frais de port (€ HT)</label>
              <input 
                type="number" 
                step="0.01"
                value={settings.planner_transport} 
                onChange={e => updateSetting('planner_transport', parseFloat(e.target.value) || 0)} 
                onFocus={e => e.target.select()}
              />
            </div>
            <div>
              <label>Boîte Transport (€ HT)</label>
              <input 
                type="number" 
                step="0.01"
                value={settings.planner_box} 
                onChange={e => updateSetting('planner_box', parseFloat(e.target.value) || 0)} 
                onFocus={e => e.target.select()}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr' }}>
            
            {/* Section 2: Tableau des besoins par animal */}
            <div className="glass-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Calculator size={24} color="var(--primary)" /> Besoins par animal
              </h2>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '1rem' }}>Animal</th>
                      <th style={{ padding: '1rem' }}>Nourri à</th>
                      <th style={{ padding: '1rem' }}>Nbre/sem</th>
                      <th style={{ padding: '1rem' }}>Total (3 mois)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animalNeeds.map(need => (
                      <tr key={need.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{need.name}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{need.foodName}</td>
                        <td style={{ padding: '1rem' }}>
                          <input 
                            type="number" 
                            step="0.1"
                            style={{ width: '80px', padding: '0.3rem 0.5rem', margin: 0 }}
                            value={plannerOverrides[need.id]?.perWeek ?? (need.perWeek === 0 ? '' : need.perWeek)}
                            onChange={e => {
                              const val = e.target.value;
                              setPlannerOverrides(prev => ({
                                ...prev,
                                [need.id]: { perWeek: val === '' ? 0 : parseFloat(val) }
                              }));
                            }}
                            onFocus={e => e.target.select()}
                          />
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{need.total.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Liste consolidée des achats */}
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.25rem' }}>
                  <Download size={24} color="var(--secondary)" /> Liste des courses
                </h2>
                <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={18} /> Export Excel / CSV
                </button>
              </div>
              
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Type</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Animaux</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Besoin Total</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Stock</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Max Congélo</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>A acheter</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Prix Unit</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shoppingList.map(item => (
                      <tr key={item.foodId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{item.nbAnimals}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{item.neededTotal.toFixed(0)}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: item.stock === 0 ? 'var(--danger)' : 'inherit' }}>{item.stock}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{item.maxFreezer || '∞'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: 'var(--secondary)' }}>{item.toBuy}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Récapitulatif Final */}
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Sous-total proies (TTC):</span>
                    <span>{formatCurrency(globalTotals.preyTTC)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Boîte polystyrène (TTC):</span>
                    <span>{formatCurrency(globalTotals.boxTTC)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Transport (TTC):</span>
                    <span>{formatCurrency(globalTotals.transportTTC)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
                    <span>TOTAL GLOBAL TTC:</span>
                    <span>{formatCurrency(globalTotals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
