import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Drumstick, Trash2, Edit2, AlertTriangle, Euro } from 'lucide-react';
import { formatCurrency } from '../utils/costCalculator';

export function Foods() {
  const { foods, setFoods } = useAppContext();
  const [editingId, setEditingId] = useState(null);
  
  const [newFood, setNewFood] = useState({ 
    name: '', 
    unitPrice: 0.50, 
    stock: 0, 
    alertThreshold: 5 
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
    
    setNewFood({ name: '', unitPrice: 0.50, stock: 0, alertThreshold: 5 });
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

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Stock de Nourriture</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gérez votre inventaire de proies et vos seuils d'alerte.</p>
      </header>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
        
        {/* Formulaire d'ajout / édition */}
        <div className="glass-panel" style={{ height: 'fit-content', padding: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {editingId ? <Edit2 size={24} color="var(--primary)" /> : <Plus size={24} color="var(--primary)" />}
            {editingId ? 'Modifier la Proie' : 'Nouvelle Proie'}
          </h2>
          
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label>Nom ou Type (ex: Souris 5-6g, Grillon)</label>
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

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editingId ? 'Mettre à jour' : 'Ajouter au stock'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setNewFood({ name: '', unitPrice: 0.50, stock: 0, alertThreshold: 5 }); }}>
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
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem',
                    borderLeft: isAlert ? '4px solid var(--danger)' : '4px solid var(--primary)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{food.name}</h3>
                        {isAlert && <span className="badge" style={{ background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><AlertTriangle size={12} /> Stock Faible</span>}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem' }}>
                        <span>Prix unitaire: {formatCurrency(food.unitPrice)}</span>
                        <span>Seuil alerte: {food.alertThreshold}</span>
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
    </div>
  );
}
