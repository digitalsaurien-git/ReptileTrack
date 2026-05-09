import { useState, useMemo, useEffect, Fragment } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Drumstick, Trash2, Edit2, AlertTriangle, Euro, Calculator, Download, Settings, Snowflake, Truck, Package, Users, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '../utils/costCalculator';
import { sortAlphabetically } from '../utils/sortingUtils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import supplierCatalogData from '../data/supplierCatalog';
import { compareFrozenItems, compareInsectItems } from '../utils/supplierCatalogSort';

export function Foods() {
  const { foods, setFoods, animals, settings, setSettings } = useAppContext();
  const [activeSubTab, setActiveSubTab] = useState('stock'); // 'stock' | 'planner' | 'supplier'
  const [editingId, setEditingId] = useState(null);
  const [catalogOverrides, setCatalogOverrides] = useLocalStorage('reptiltrack_supplier_catalog_overrides', {});
  const [editingCatalogItem, setEditingCatalogItem] = useState(null);
  
  // Local persistence for planner specific choices (not synced to cloud yet)
  const [plannerMetadata, setPlannerMetadata] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('reptiltrack_planner_metadata') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('reptiltrack_planner_metadata', JSON.stringify(plannerMetadata));
  }, [plannerMetadata]);
  
  // Local overrides for planner (not persisted in cloud in phase 1 as requested)
  const [plannerOverrides, setPlannerOverrides] = useState({});

  const [newFood, setNewFood] = useState({ 
    name: '', 
    unitPrice: 0.50, 
    stock: 0, 
    alertThreshold: 5,
    maxFreezer: 0,
    category: 'congelé', // 'congelé' | 'vivant'
    supplierOptions: [] // Array of { id, label, qty, price, isComparable }
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
    
    setNewFood({ name: '', unitPrice: 0.50, stock: 0, alertThreshold: 5, maxFreezer: 0, category: 'congelé', supplierOptions: [] });
  };

  const handleEdit = (food) => {
    setNewFood({
      ...food,
      category: food.category || (food.type === 'vivant' ? 'vivant' : 'congelé'),
      supplierOptions: food.supplierOptions || []
    });
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

  const addSupplierOption = () => {
    const newOption = { 
      id: crypto.randomUUID(), 
      label: 'Pack', 
      qty: 10, 
      price: 4.50, 
      isComparable: true 
    };
    updateField('supplierOptions', [...(newFood.supplierOptions || []), newOption]);
  };

  const removeSupplierOption = (id) => {
    updateField('supplierOptions', newFood.supplierOptions.filter(o => o.id !== id));
  };

  const updateSupplierOption = (id, field, value) => {
    updateField('supplierOptions', newFood.supplierOptions.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  // --- Logic Planificateur ---
  
  // 1. Filtrage animaux actifs
  const activeAnimals = useMemo(() => {
    return animals.filter(a => a.status === 'vivant' || a.status === 'malade' || !a.status);
  }, [animals]);

  const sortedFoods = useMemo(() => {
    return sortAlphabetically(foods, f => f.name);
  }, [foods]);

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

  const sortedAnimalNeeds = useMemo(() => {
    return sortAlphabetically(animalNeeds, n => n.name);
  }, [animalNeeds]);

  // --- Logic Catalogue Fournisseur ---
  const mergedCatalog = useMemo(() => {
    return supplierCatalogData.map(item => ({
      ...item,
      ...(catalogOverrides[item.id] || {})
    }));
  }, [catalogOverrides]);

  const supplierCatalog = useMemo(() => {
    const frozen = mergedCatalog.filter(i => i.catalogType === 'frozen_unit' && i.active).sort(compareFrozenItems);
    const insects = mergedCatalog.filter(i => i.catalogType === 'insect' && i.active).sort(compareInsectItems);
    
    const frozenPacks = mergedCatalog
      .filter(i => i.catalogType === 'frozen_pack' && i.active)
      .map(p => ({
        ...p,
        pricePerPiece: p.packQuantity > 0 ? p.priceHT / p.packQuantity : 0,
        priceTTC: p.priceHT * (1 + (p.vatRate / 100)),
        pricePerPieceTTC: p.packQuantity > 0 ? (p.priceHT * (1 + (p.vatRate / 100))) / p.packQuantity : 0
      }))
      .sort(compareFrozenItems);
    
    const comparisons = frozen.map(unit => {
      const bestPack = frozenPacks
        .filter(p => p.category === unit.category && p.sizeLabel === unit.sizeLabel && p.comparable)
        .reduce((best, current) => {
          const currentPricePerPiece = current.priceHT / current.packQuantity;
          const bestPricePerPiece = best ? best.priceHT / best.packQuantity : Infinity;
          return currentPricePerPiece < bestPricePerPiece ? current : best;
        }, null);
        
      const packPricePerPiece = bestPack ? bestPack.priceHT / bestPack.packQuantity : null;
      const isPackBetter = packPricePerPiece !== null && packPricePerPiece < unit.priceHT;
      
      return {
        category: unit.category,
        name: unit.productName,
        unitPrice: unit.priceHT,
        bestPack,
        packPricePerPiece,
        sizeLabel: unit.sizeLabel, // Keep for sorting
        winner: isPackBetter ? 'Pack' : (packPricePerPiece === null ? 'N/A' : 'Unité')
      };
    }).sort(compareFrozenItems);

    return { frozen, frozenPacks, comparisons, insects };
  }, [mergedCatalog]);

  const handleEditCatalogItem = (item) => {
    setEditingCatalogItem({ ...item });
  };

  const saveCatalogOverride = () => {
    if (!editingCatalogItem) return;
    setCatalogOverrides(prev => ({
      ...prev,
      [editingCatalogItem.id]: {
        priceHT: parseFloat(editingCatalogItem.priceHT),
        vatRate: parseFloat(editingCatalogItem.vatRate),
        packQuantity: parseInt(editingCatalogItem.packQuantity) || undefined,
        minPieces: parseInt(editingCatalogItem.minPieces) || undefined,
        maxPieces: parseInt(editingCatalogItem.maxPieces) || undefined,
        comparable: editingCatalogItem.comparable,
        active: editingCatalogItem.active,
        note: editingCatalogItem.note
      }
    }));
    setEditingCatalogItem(null);
  };

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
          category: food?.category || (food?.type === 'vivant' ? 'vivant' : 'congelé'),
          supplierOptions: food?.supplierOptions || [],
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

    const items = Object.values(list).map(item => {
      const rawBuy = Math.max(0, item.neededTotal - item.stock);
      const freezerSpace = item.maxFreezer > 0 ? Math.max(0, item.maxFreezer - item.stock) : 999999;
      const toBuy = Math.min(rawBuy, freezerSpace);
      
      let recommendation = "-";
      let finalRounded = 0;
      let finalPriceHT = 0;
      let finalSurplus = 0;
      let usedVatRate = settings.planner_vat || 20;

      if (toBuy <= 0) {
        recommendation = "Aucun achat";
        finalRounded = 0;
        finalPriceHT = 0;
        finalSurplus = 0;
      } else if (item.category === 'congelé') {
        // Find matching catalog items
        // Try to match by direct name or similar name
        const unitOffer = mergedCatalog.find(c => 
          c.catalogType === 'frozen_unit' && 
          (c.productName === item.name || item.name.includes(c.productName) || c.productName.includes(item.name))
        );
        
        const packOffers = mergedCatalog.filter(c => 
          c.catalogType === 'frozen_pack' && 
          unitOffer && c.category === unitOffer.category && c.sizeLabel === unitOffer.sizeLabel
        );

        if (unitOffer || packOffers.length > 0) {
          if (unitOffer) usedVatRate = unitOffer.vatRate;
          else if (packOffers.length > 0) usedVatRate = packOffers[0].vatRate;

          const scenarios = [];

          // Scenario A: Exact unit purchase
          if (unitOffer) {
            const qty = Math.ceil(toBuy);
            scenarios.push({
              label: `${qty} unités`,
              qty,
              cost: qty * unitOffer.priceHT,
              surplus: qty - toBuy
            });
          }

          // Scenarios B & C: Packs only or Packs + Units
          packOffers.forEach(pack => {
            if (!pack.packQuantity || pack.packQuantity <= 0) return;
            
            // Packs only (cover the whole need)
            const numPacksOnly = Math.ceil(toBuy / pack.packQuantity);
            scenarios.push({
              label: `${numPacksOnly} × pack ${pack.packQuantity}`,
              qty: numPacksOnly * pack.packQuantity,
              cost: numPacksOnly * pack.priceHT,
              surplus: (numPacksOnly * pack.packQuantity) - toBuy
            });

            // Mixed: Packs covering part of it, units covering the rest
            if (unitOffer) {
              const numPacks = Math.floor(toBuy / pack.packQuantity);
              if (numPacks > 0) {
                const remaining = Math.max(0, toBuy - (numPacks * pack.packQuantity));
                const numUnits = Math.ceil(remaining);
                if (numUnits > 0) {
                  scenarios.push({
                    label: `${numPacks} × pack ${pack.packQuantity} + ${numUnits} unités`,
                    qty: (numPacks * pack.packQuantity) + numUnits,
                    cost: (numPacks * pack.priceHT) + (numUnits * unitOffer.priceHT),
                    surplus: ((numPacks * pack.packQuantity) + numUnits) - toBuy
                  });
                }
              }
            }
          });

          // Selection of the best scenario: priority to coverage, then lowest cost, then lowest surplus
          scenarios.sort((a, b) => {
            if (Math.abs(a.cost - b.cost) > 0.001) return a.cost - b.cost;
            return a.surplus - b.surplus;
          });

          if (scenarios.length > 0) {
            const best = scenarios[0];
            recommendation = best.label;
            finalRounded = best.qty;
            finalPriceHT = best.cost;
            finalSurplus = best.surplus;
          } else {
            recommendation = "Prix fournisseur manquant";
            finalRounded = Math.ceil(toBuy);
            finalPriceHT = finalRounded * item.unitPrice;
            finalSurplus = finalRounded - toBuy;
          }
        } else {
          recommendation = "Prix fournisseur manquant";
          finalRounded = Math.ceil(toBuy);
          finalPriceHT = finalRounded * item.unitPrice;
          finalSurplus = finalRounded - toBuy;
        }
      } else {
        // Logic for live insects (not modified as requested)
        const saved = plannerMetadata[item.foodId] || {};
        const selectedOptId = saved.selectedOptionId;
        const nbPacks = saved.nbPacks || 0;
        const opt = selectedOptId === 'unit' 
          ? { id: 'unit', label: 'Unité', qty: 1, price: item.unitPrice, isComparable: true }
          : item.supplierOptions?.find(o => o.id === selectedOptId);

        if (opt) {
          finalPriceHT = nbPacks * opt.price;
          finalRounded = opt.isComparable ? nbPacks * opt.qty : 0;
          finalSurplus = Math.max(0, finalRounded - toBuy);
        } else {
          finalPriceHT = 0;
          finalRounded = 0;
          finalSurplus = 0;
        }
        recommendation = "-";
      }
      
      const totalTTC = finalPriceHT * (1 + (usedVatRate / 100));
      
      return {
        ...item,
        toBuy: parseFloat(toBuy.toFixed(2)),
        rounded: finalRounded,
        subTotal: finalPriceHT,
        total: totalTTC,
        surplus: finalSurplus,
        recommendation,
        selection: plannerMetadata[item.foodId] || {}
      };
    });

    return items;
  }, [animalNeeds, foods, settings.planner_vat, plannerMetadata, mergedCatalog]);

  const sortedFrozenList = useMemo(() => {
    return sortAlphabetically(shoppingList.filter(i => i.category === 'congelé'), i => i.name);
  }, [shoppingList]);

  const sortedInsectsList = useMemo(() => {
    return sortAlphabetically(shoppingList.filter(i => i.category === 'vivant'), i => i.name);
  }, [shoppingList]);

  // Totaux globaux
  const globalTotals = useMemo(() => {
    const preySubtotalTTC = shoppingList.reduce((sum, item) => sum + item.total, 0);
    
    // Calcul Transport & Box (HT -> TTC)
    const vatRate = (settings.planner_vat || 20) / 100;
    const participants = settings.planner_participants || 1;
    
    const transportHT = (settings.planner_transport || 0) / participants;
    const boxHT = (settings.planner_box || 0) / participants;
    
    const transportTTC = transportHT * (1 + vatRate);
    const boxTTC = boxHT * (1 + vatRate);
    
    return {
      preyTTC: preySubtotalTTC,
      transportHT,
      transportTTC,
      boxHT,
      boxTTC,
      grandTotal: preySubtotalTTC + transportTTC + boxTTC,
      participants
    };
  }, [shoppingList, settings.planner_transport, settings.planner_box, settings.planner_vat, settings.planner_participants]);
  
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
      `;;;;;;;Participants;${globalTotals.participants}`,
      `;;;;;;;Transport (part);${globalTotals.transportHT.toFixed(2)}`,
      `;;;;;;;Boîte (part);${globalTotals.boxHT.toFixed(2)}`,
      `;;;;;;;TOTAL PERSO TTC;${globalTotals.grandTotal.toFixed(2)}`
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
          <button 
            onClick={() => setActiveSubTab('supplier')}
            className={`btn ${activeSubTab === 'supplier' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
          >
            <Truck size={18} style={{ marginRight: '0.5rem' }} /> Fournisseur
          </button>
        </div>
      </header>

      {activeSubTab === 'stock' && (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
          {/* Formulaire d'ajout / édition */}
          <div className="glass-panel" style={{ height: 'fit-content', padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              {editingId ? <Edit2 size={24} color="var(--primary)" /> : <Plus size={24} color="var(--primary)" />}
              {editingId ? 'Modifier la Proie' : 'Nouvelle Proie'}
            </h2>
            
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <button 
                  type="button"
                  onClick={() => updateField('category', 'congelé')}
                  className={`btn ${newFood.category === 'congelé' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                >
                  Congelé
                </button>
                <button 
                  type="button"
                  onClick={() => updateField('category', 'vivant')}
                  className={`btn ${newFood.category === 'vivant' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                >
                  Vivant
                </button>
              </div>

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

              {/* Options Fournisseur */}
              <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>Options Fournisseur / Packs</label>
                  <button type="button" onClick={addSupplierOption} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                    <Plus size={12} /> Ajouter
                  </button>
                </div>
                
                {newFood.supplierOptions?.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Option par défaut : Achat à l'unité.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {newFood.supplierOptions.map(opt => (
                      <div key={opt.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 30px 30px', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          placeholder="Ex: Pack de 10" 
                          value={opt.label} 
                          onChange={e => updateSupplierOption(opt.id, 'label', e.target.value)}
                          style={{ padding: '0.3rem', fontSize: '0.75rem' }}
                        />
                        <input 
                          type="number" 
                          placeholder="Qté" 
                          value={opt.qty} 
                          onChange={e => updateSupplierOption(opt.id, 'qty', parseInt(e.target.value))}
                          style={{ padding: '0.3rem', fontSize: '0.75rem' }}
                        />
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="Prix HT" 
                          value={opt.price} 
                          onChange={e => updateSupplierOption(opt.id, 'price', parseFloat(e.target.value))}
                          style={{ padding: '0.3rem', fontSize: '0.75rem' }}
                        />
                        <input 
                          type="checkbox" 
                          checked={opt.isComparable} 
                          onChange={e => updateSupplierOption(opt.id, 'isComparable', e.target.checked)}
                          title="Comparable en pièces ?"
                        />
                        <button type="button" onClick={() => removeSupplierOption(opt.id)} style={{ padding: '0.3rem', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Mettre à jour' : 'Ajouter au stock'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setNewFood({ name: '', unitPrice: 0.50, stock: 0, alertThreshold: 5, maxFreezer: 0, category: 'congelé', supplierOptions: [] }); }}>
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
                {sortedFoods.map(food => {
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
      )}

      {activeSubTab === 'planner' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: Réglages Globaux */}
          <div className="glass-panel" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
            gap: '1rem', 
            padding: '1.25rem' 
          }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <Calculator size={14} /> Durée (sem.)
              </label>
              <input 
                type="number" 
                style={{ padding: '0.4rem 0.75rem' }}
                value={settings.planner_duration} 
                onChange={e => updateSetting('planner_duration', parseInt(e.target.value))} 
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <Euro size={14} /> TVA (%)
              </label>
              <input 
                type="number" 
                step="0.1"
                style={{ padding: '0.4rem 0.75rem' }}
                value={settings.planner_vat} 
                onChange={e => updateSetting('planner_vat', parseFloat(e.target.value))} 
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <Truck size={14} /> Port (€ HT)
              </label>
              <input 
                type="number" 
                step="0.01"
                style={{ padding: '0.4rem 0.75rem' }}
                value={settings.planner_transport} 
                onChange={e => updateSetting('planner_transport', parseFloat(e.target.value) || 0)} 
                onFocus={e => e.target.select()}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <Package size={14} /> Boîte (€ HT)
              </label>
              <input 
                type="number" 
                step="0.01"
                style={{ padding: '0.4rem 0.75rem' }}
                value={settings.planner_box} 
                onChange={e => updateSetting('planner_box', parseFloat(e.target.value) || 0)} 
                onFocus={e => e.target.select()}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <Users size={14} /> Pers.
              </label>
              <input 
                type="number" 
                min="1"
                step="1"
                style={{ padding: '0.4rem 0.75rem' }}
                value={settings.planner_participants || 1} 
                onChange={e => {
                  const val = parseInt(e.target.value);
                  updateSetting('planner_participants', isNaN(val) || val < 1 ? 1 : val);
                }}
                onBlur={e => {
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1) updateSetting('planner_participants', 1);
                }}
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
                    {sortedAnimalNeeds.map(need => (
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
            
            {/* Section 2: Proies Congelées */}
            <div className="glass-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Snowflake size={24} color="var(--primary)" /> Proies Congelées
              </h2>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Produit</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Animaux</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Besoin 3 mois</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Stock</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>À couvrir</th>
                      <th style={{ padding: '1rem' }}>Achat recommandé</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Qté achetée</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Surplus</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total HT</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFrozenList.map(item => (
                      <tr key={item.foodId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span className="badge" style={{ background: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
                            <Users size={12} style={{ marginRight: '0.3rem' }} /> {item.nbAnimals}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{item.neededTotal.toFixed(0)}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{item.stock}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: 'var(--warning)' }}>{item.toBuy}</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--primary)' }}>{item.recommendation || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{item.rounded || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: item.surplus > 0 ? 'var(--secondary)' : 'inherit' }}>
                          {item.surplus > 0 ? `+${item.surplus.toFixed(0)}` : '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(item.subTotal)}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Insectes Vivants */}
            <div className="glass-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Drumstick size={24} color="var(--secondary)" /> Insectes Vivants
              </h2>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Insecte</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Besoin</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Stock</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>À prévoir</th>
                      <th style={{ padding: '1rem' }}>Conditionnement</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Nbre</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Total acheté</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Prix TTC</th>
                      <th style={{ padding: '1rem' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInsectsList.map(item => {
                      const toProvide = Math.max(0, item.neededTotal - item.stock);
                      const surplus = item.rounded > 0 ? (item.rounded - toProvide) : 0;
                      
                      return (
                        <tr key={item.foodId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>{item.neededTotal.toFixed(0)}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>{item.stock}</td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: 'var(--warning)' }}>{toProvide.toFixed(0)}</td>
                          <td style={{ padding: '1rem' }}>
                            <select 
                              style={{ padding: '0.3rem', fontSize: '0.8rem', width: '100%' }}
                              value={item.selection.selectedOptionId || ''}
                              onChange={e => {
                                setPlannerMetadata(prev => ({
                                  ...prev,
                                  [item.foodId]: { ...prev[item.foodId], selectedOptionId: e.target.value }
                                }));
                              }}
                            >
                              <option value="">Choisir...</option>
                              <option value="unit">Unité ({formatCurrency(item.unitPrice)})</option>
                              {item.supplierOptions?.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label} ({opt.qty}{opt.isComparable ? ' pcs' : ''} - {formatCurrency(opt.price)})</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="0"
                              style={{ width: '60px', padding: '0.3rem', margin: 0 }}
                              value={item.selection.nbPacks || ''}
                              onChange={e => {
                                setPlannerMetadata(prev => ({
                                  ...prev,
                                  [item.foodId]: { ...prev[item.foodId], nbPacks: parseInt(e.target.value) || 0 }
                                }));
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontWeight: 700 }}>{item.rounded}</div>
                            {surplus > 0 && <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>Surplus: +{surplus.toFixed(0)}</div>}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.total)}</td>
                          <td style={{ padding: '1rem' }}>
                            {item.rounded >= toProvide ? (
                              <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>Complété</span>
                            ) : (
                              <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Incomplet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Récapitulatif Final */}
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.25rem' }}>
                  <Calculator size={24} color="var(--primary)" /> Bilan de commande
                </h2>
                <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={18} /> Export Excel / CSV
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Sous-total Nourriture (TTC):</span>
                    <span>{formatCurrency(shoppingList.reduce((sum, item) => sum + item.total, 0))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Boîte polystyrène (TTC) {globalTotals.participants > 1 ? `(1/${globalTotals.participants})` : ''}:</span>
                    <span>{formatCurrency(globalTotals.boxTTC)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Transport (TTC) {globalTotals.participants > 1 ? `(1/${globalTotals.participants})` : ''}:</span>
                    <span>{formatCurrency(globalTotals.transportTTC)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                    <span>TOTAL GLOBAL TTC:</span>
                    <span>{formatCurrency(globalTotals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

           </div>
         </div>
        )}

        {activeSubTab === 'supplier' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Section 1: Frozen — à l’unité */}
            <div className="glass-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Snowflake size={24} color="var(--primary)" /> Frozen — à l’unité
              </h2>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Catégorie</th>
                      <th style={{ padding: '1rem' }}>Produit</th>
                      <th style={{ padding: '1rem' }}>Prix HT</th>
                      <th style={{ padding: '1rem' }}>TVA %</th>
                      <th style={{ padding: '1rem' }}>Prix TTC</th>
                      <th style={{ padding: '1rem' }}>Unité</th>
                      <th style={{ padding: '1rem' }}>Remise Volume</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierCatalog.frozen.map(f => {
                      const priceTTC = f.priceHT * (1 + (f.vatRate / 100));
                      const bulkText = f.bulkRules?.length > 0 
                        ? f.bulkRules.map(r => `${r.minQuantity}+: ${formatCurrency(r.priceHT)}`).join(', ') 
                        : '-';
                      return (
                        <tr key={f.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '1rem' }}><span className="badge" style={{ background: 'rgba(0,180,216,0.1)', color: 'var(--primary)' }}>{f.category}</span></td>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{f.productName}</td>
                          <td style={{ padding: '1rem' }}>{formatCurrency(f.priceHT)}</td>
                          <td style={{ padding: '1rem' }}>{f.vatRate}%</td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(priceTTC)}</td>
                          <td style={{ padding: '1rem' }}>{f.unit}</td>
                          <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{bulkText}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleEditCatalogItem(f)}>
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Frozen packed — boîtes */}
            <div className="glass-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Package size={24} color="var(--secondary)" /> Frozen packed — boîtes
              </h2>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Catégorie</th>
                      <th style={{ padding: '1rem' }}>Produit</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Qté/Boîte</th>
                      <th style={{ padding: '1rem' }}>Prix HT boîte</th>
                      <th style={{ padding: '1rem' }}>TVA %</th>
                      <th style={{ padding: '1rem' }}>Prix TTC boîte</th>
                      <th style={{ padding: '1rem' }}>HT / pc</th>
                      <th style={{ padding: '1rem' }}>TTC / pc</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierCatalog.frozenPacks.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem' }}><span className="badge" style={{ background: 'rgba(255,159,67,0.1)', color: 'var(--secondary)' }}>{p.category}</span></td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{p.productName} ({p.sizeLabel})</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{p.packQuantity}</td>
                        <td style={{ padding: '1rem' }}>{formatCurrency(p.priceHT)}</td>
                        <td style={{ padding: '1rem' }}>{p.vatRate}%</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{formatCurrency(p.priceTTC)}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{formatCurrency(p.pricePerPiece)}</td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>{formatCurrency(p.pricePerPieceTTC)}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleEditCatalogItem(p)}>
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Comparaison Frozen */}
            <div className="glass-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Calculator size={24} color="var(--primary)" /> Comparaison Frozen (HT / pièce)
              </h2>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Catégorie</th>
                      <th style={{ padding: '1rem' }}>Produit</th>
                      <th style={{ padding: '1rem' }}>Prix HT unité</th>
                      <th style={{ padding: '1rem' }}>HT pack / pièce</th>
                      <th style={{ padding: '1rem' }}>Pack disponible</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Meilleur prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierCatalog.comparisons.map(c => (
                      <tr key={`${c.category}-${c.name}`} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem' }}><span className="badge" style={{ background: 'rgba(0,180,216,0.1)', color: 'var(--primary)' }}>{c.category}</span></td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '1rem' }}>{formatCurrency(c.unitPrice)}</td>
                        <td style={{ padding: '1rem' }}>{c.packPricePerPiece ? formatCurrency(c.packPricePerPiece) : '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          {c.bestPack ? (
                            <span style={{ fontSize: '0.8rem' }}>
                              <CheckCircle size={14} color="var(--primary)" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                              {c.bestPack.packQuantity} pcs ({formatCurrency(c.bestPack.priceHT)})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              <XCircle size={14} color="var(--danger)" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                              Aucun pack
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {c.winner === 'N/A' ? '-' : (
                            <span className="badge" style={{ 
                              background: c.winner === 'Pack' ? 'var(--primary)' : 'var(--secondary)',
                              color: 'white'
                            }}>
                              {c.winner}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Catalogue Insectes */}
            <div className="glass-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                <Drumstick size={24} color="var(--secondary)" /> Catalogue Insectes
              </h2>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel-secondary)' }}>
                      <th style={{ padding: '1rem' }}>Famille</th>
                      <th style={{ padding: '1rem' }}>Produit</th>
                      <th style={{ padding: '1rem' }}>Taille</th>
                      <th style={{ padding: '1rem' }}>Cond.</th>
                      <th style={{ padding: '1rem' }}>Prix HT</th>
                      <th style={{ padding: '1rem' }}>TVA %</th>
                      <th style={{ padding: '1rem' }}>Prix TTC</th>
                      <th style={{ padding: '1rem' }}>Comparabilité</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierCatalog.insects.map(i => {
                      const priceTTC = i.priceHT * (1 + (i.vatRate / 100));
                      const compColor = i.comparisonType === 'exact' ? 'var(--primary)' : (i.comparisonType === 'approximate' ? 'var(--secondary)' : 'var(--text-muted)');
                      const compText = i.comparisonType === 'exact' ? 'Comparable' : (i.comparisonType === 'approximate' ? 'Approximatif' : 'Non comparable');
                      
                      return (
                        <tr key={i.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{i.family}</td>
                          <td style={{ padding: '1rem' }}>{i.productName}</td>
                          <td style={{ padding: '1rem' }}>{i.sizeLabel || '-'}</td>
                          <td style={{ padding: '1rem' }}>{i.unit === 'box' ? `${i.minPieces}-${i.maxPieces} pcs` : i.unit}</td>
                          <td style={{ padding: '1rem' }}>{formatCurrency(i.priceHT)}</td>
                          <td style={{ padding: '1rem' }}>{i.vatRate}%</td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(priceTTC)}</td>
                          <td style={{ padding: '1rem' }}>
                             <span style={{ fontSize: '0.8rem', color: compColor }}>{compText}</span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleEditCatalogItem(i)}>
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Modal d'édition Catalogue */}
        {editingCatalogItem && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Édition Produit Catalogue</h3>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setEditingCatalogItem(null)}>✕</button>
              </div>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Produit</label>
                  <input type="text" value={editingCatalogItem.productName} disabled style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Prix HT (€)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editingCatalogItem.priceHT} 
                      onChange={e => setEditingCatalogItem({ ...editingCatalogItem, priceHT: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>TVA (%)</label>
                    <input 
                      type="number" 
                      value={editingCatalogItem.vatRate} 
                      onChange={e => setEditingCatalogItem({ ...editingCatalogItem, vatRate: e.target.value })}
                    />
                  </div>
                </div>

                {editingCatalogItem.catalogType === 'frozen_pack' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Quantité par pack</label>
                    <input 
                      type="number" 
                      value={editingCatalogItem.packQuantity} 
                      onChange={e => setEditingCatalogItem({ ...editingCatalogItem, packQuantity: e.target.value })}
                    />
                  </div>
                )}

                {editingCatalogItem.unit === 'box' && editingCatalogItem.minPieces !== undefined && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Min Pièces</label>
                      <input 
                        type="number" 
                        value={editingCatalogItem.minPieces} 
                        onChange={e => setEditingCatalogItem({ ...editingCatalogItem, minPieces: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Max Pièces</label>
                      <input 
                        type="number" 
                        value={editingCatalogItem.maxPieces} 
                        onChange={e => setEditingCatalogItem({ ...editingCatalogItem, maxPieces: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={editingCatalogItem.comparable} 
                      onChange={e => setEditingCatalogItem({ ...editingCatalogItem, comparable: e.target.checked })} 
                    />
                    Comparable
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={editingCatalogItem.active} 
                      onChange={e => setEditingCatalogItem({ ...editingCatalogItem, active: e.target.checked })} 
                    />
                    Actif
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Note / Commentaire</label>
                  <textarea 
                    value={editingCatalogItem.note || ''} 
                    onChange={e => setEditingCatalogItem({ ...editingCatalogItem, note: e.target.value })}
                    rows={2}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveCatalogOverride}>Enregistrer les modifications</button>
                  <button className="btn btn-secondary" onClick={() => setEditingCatalogItem(null)}>Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
