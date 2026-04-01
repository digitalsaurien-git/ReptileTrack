import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { 
  ChevronLeft, Save, Plus, Trash2, Camera, MapPin, 
  Bone, Activity, FileText, Info, Calendar, ClipboardList,
  Scale, Shield, Truck, Printer, Euro, Zap, Send, Edit2, TrendingUp
} from 'lucide-react';
import { speciesList } from '../data/species';
import { getPlaceholderImage } from '../utils/imageUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { animals, setAnimals, terrariums, foods, setFoods } = useAppContext();
  
  const [animal, setAnimal] = useState(null);
  const [activeTab, setActiveTab] = useState('infos');
  const [newEvent, setNewEvent] = useState({ 
    type: 'repas', 
    date: new Date().toISOString().split('T')[0], 
    notes: '', 
    foodId: '', 
    quantity: 1, 
    weight: '', 
    weightUnit: 'g' 
  });
  const [newDoc, setNewDoc] = useState({ name: '', type: 'facture', date: new Date().toISOString().split('T')[0], ref: '' });

  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const found = animals.find(a => a.id === id);
    if (found) {
      setAnimal({ ...found });
    } else {
      navigate('/animals');
    }
  }, [id, animals, navigate]);

  if (!animal) return null;

  const handleSave = () => {
    const updatedList = animals.map(a => a.id === id ? animal : a);
    setAnimals(updatedList);
    navigate('/animals');
  };

  const handleDelete = () => {
    if (window.confirm("Supprimer cet animal ? Cette action est irréversible.")) {
      const updatedList = animals.filter(a => a.id !== id);
      setAnimals(updatedList);
      navigate('/animals');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.date || !newEvent.type) return;
    
    let historyEvent = { ...newEvent, id: crypto.randomUUID() };

    // Gestion du repas et des stocks
    if (newEvent.type === 'repas' && newEvent.foodId) {
      const selectedFood = foods.find(f => f.id === newEvent.foodId);
      if (selectedFood) {
        historyEvent.foodName = selectedFood.name;
        const remainingStock = selectedFood.stock - newEvent.quantity;
        
        // Mettre à jour le stock localement
        const updatedFoods = foods.map(f => 
          f.id === selectedFood.id ? { ...f, stock: remainingStock } : f
        );
        setFoods(updatedFoods);

        // Vérification seuil d'alerte
        if (remainingStock <= selectedFood.alertThreshold) {
          alert(`⚠️ Le stock de ${selectedFood.name} est faible (${remainingStock} restants).`);
          
          const webhookUrl = localStorage.getItem('reptiltrack_webhook_url');
          if (webhookUrl) {
            try {
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'stock_alert',
                  foodName: selectedFood.name,
                  stockRemaining: remainingStock,
                  threshold: selectedFood.alertThreshold,
                  timestamp: new Date().toISOString()
                })
              });
            } catch (err) {
              console.error("Erreur Webhook alerte stock:", err);
            }
          }
        }
      }
    }

    setAnimal({
      ...animal,
      history: [historyEvent, ...(animal.history || [])]
    });
    setNewEvent({ 
      type: 'repas', 
      date: new Date().toISOString().split('T')[0], 
      notes: '', 
      foodId: '', 
      quantity: 1, 
      weight: '', 
      weightUnit: 'g' 
    });
  };

  const handleAddDoc = (e) => {
    e.preventDefault();
    if (!newDoc.name) return;
    const doc = { ...newDoc, id: crypto.randomUUID() };
    setAnimal({
      ...animal,
      documents: [doc, ...(animal.documents || [])]
    });
    setNewDoc({ name: '', type: 'facture', date: new Date().toISOString().split('T')[0], ref: '' });
  };
  
  const handleDeleteEvent = (eventId) => {
    const eventToDelete = animal.history.find(e => e.id === eventId);
    if (!eventToDelete) return;

    if (window.confirm("Supprimer cet évènement ?")) {
      // Restaurer le stock si c'était un repas
      if (eventToDelete.type === 'repas' && eventToDelete.foodId && eventToDelete.quantity) {
        const food = foods.find(f => f.id === eventToDelete.foodId);
        if (food) {
          const updatedFoods = foods.map(f => 
            f.id === food.id ? { ...f, stock: f.stock + eventToDelete.quantity } : f
          );
          setFoods(updatedFoods);
        }
      }

      const updatedHistory = animal.history.filter(e => e.id !== eventId);
      const updatedAnimal = { ...animal, history: updatedHistory };
      setAnimal(updatedAnimal);
      
      // Sauvegarde automatique dans la liste globale
      const updatedList = animals.map(a => a.id === id ? updatedAnimal : a);
      setAnimals(updatedList);
    }
  };

  const handleEditEvent = (event) => {
    setNewEvent({
      ...event,
      date: event.date.split('T')[0] // S'assurer du format pour l'input date
    });
    // On scroll vers le formulaire
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteDoc = (docId) => {
    setAnimal({
      ...animal,
      documents: (animal.documents || []).filter(d => d.id !== docId)
    });
  };

  const updateField = (field, value) => {
    setAnimal(prev => ({ ...prev, [field]: value }));
  };

  const handleSendToWebhook = async () => {
    const webhookUrl = localStorage.getItem('reptiltrack_webhook_url');
    if (!webhookUrl) {
      alert("⚠️ Aucune URL de webhook n'est configurée.\nVeuillez l'ajouter dans les Paramètres (roue crantée) du menu principal.");
      return;
    }
    
    setIsSending(true);
    try {
      const payload = {
        animal: animal,
        timestamp: new Date().toISOString(),
        source: 'ReptilTrack V2'
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
         alert("✅ Données de l'animal transmises avec succès à Make !");
      } else {
         alert("⚠️ Erreur : Le webhook a retourné un statut " + response.status);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Impossible de joindre l'URL. Vérifiez que l'URL est correcte et accessible (CORS).");
    } finally {
      setIsSending(false);
    }
  };

  const lastMealEvent = animal?.history?.find(e => e.type === 'repas');
  const lastMealDate = lastMealEvent ? new Date(lastMealEvent.date) : null;
  let nextMealDate = null;
  if (lastMealDate && animal?.feedingFrequency) {
    nextMealDate = new Date(lastMealDate);
    nextMealDate.setDate(nextMealDate.getDate() + parseInt(animal.feedingFrequency));
  }

  const handleFeedNow = async () => {
    if (!animal.defaultFoodId || !animal.defaultFoodQuantity) {
      alert("⚠️ Veuillez configurer la proie habituelle de cet animal (onglet Identité) pour utiliser cette fonction.");
      return;
    }
    const selectedFood = foods.find(f => f.id === animal.defaultFoodId);
    if (!selectedFood) {
      alert("⚠️ La proie habituelle configurée n'existe plus dans le stock.");
      return;
    }

    const remainingStock = selectedFood.stock - animal.defaultFoodQuantity;
    
    // Mettre à jour le stock
    const updatedFoods = foods.map(f => 
      f.id === selectedFood.id ? { ...f, stock: remainingStock } : f
    );
    setFoods(updatedFoods);

    // Vérification seuil d'alerte
    if (remainingStock <= selectedFood.alertThreshold) {
      alert(`⚠️ Attention : Le stock de ${selectedFood.name} est au plus bas (${remainingStock} restants).`);
      
      const webhookUrl = localStorage.getItem('reptiltrack_webhook_url');
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'stock_alert',
              foodName: selectedFood.name,
              stockRemaining: remainingStock,
              threshold: selectedFood.alertThreshold,
              timestamp: new Date().toISOString()
            })
          });
        } catch (err) {}
      }
    }

    const newHistoryEvent = {
      id: crypto.randomUUID(),
      type: 'repas',
      date: new Date().toISOString().split('T')[0],
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantity: animal.defaultFoodQuantity,
      notes: "Nourrissage rapide"
    };

    const newAnimal = {
      ...animal,
      history: [newHistoryEvent, ...(animal.history || [])]
    };
    
    setAnimal(newAnimal);
    
    // Auto-save logic
    const updatedList = animals.map(a => a.id === id ? newAnimal : a);
    setAnimals(updatedList);
  };

  return (
    <div className="animate-fade-in print-container">
      <header className="no-print" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/animals')} style={{ padding: '0.6rem' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: '200px' }}>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{animal.commonName || 'Specimen'} {animal.nickname ? `"${animal.nickname}"` : ''}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fiche détaillée de l'animal</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleSendToWebhook} 
            disabled={isSending}
            style={{ padding: '0.6rem 1.25rem', color: '#ffb900', borderColor: 'rgba(255,185,0,0.3)' }} 
            title="Transmettre à Make (Webhook)"
          >
            <Send size={18} /> <span className="hide-mobile">{isSending ? 'Envoi...' : 'Webhook'}</span>
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()} style={{ padding: '0.6rem 1.25rem', color: 'var(--secondary)', borderColor: 'var(--secondary-container)' }} aria-label="Imprimer la fiche PDF">
            <Printer size={18} /> <span className="hide-mobile">Fiche PDF</span>
          </button>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '0.6rem 1.25rem' }} aria-label="Enregistrer les modifications">
            <Save size={18} /> <span className="hide-mobile">Enregistrer</span>
          </button>
          <button className="btn" onClick={handleDelete} style={{ background: 'var(--danger)', color: 'var(--text-on-primary)', padding: '0.6rem' }} aria-label="Supprimer cet animal">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {[
          { id: 'infos', label: 'Identité', icon: <Info size={18} /> },
          { id: 'legal', label: 'Réglementaire', icon: <Shield size={18} /> },
          { id: 'entry', label: 'Entrée', icon: <Truck size={18} /> },
          { id: 'history', label: 'Journal', icon: <Activity size={18} /> },
          { id: 'analytics', label: 'Analyses', icon: <TrendingUp size={18} /> },
          { id: 'docs', label: 'Documents', icon: <FileText size={18} /> }
        ].map(tab => (
          <button 
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.6rem 1.2rem', background: activeTab === tab.id ? 'var(--primary)' : 'transparent', border: activeTab === tab.id ? 'none' : '1px solid var(--border-light)', fontSize: '0.85rem' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(78, 222, 163, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(78, 222, 163, 0.2)' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Dernier Repas</div>
            <div style={{ fontWeight: 600, color: lastMealDate ? '#fff' : 'var(--warning)', fontSize: '1.1rem' }}>
              {lastMealDate ? lastMealDate.toLocaleDateString() : 'Aucun repas enregistré'}
            </div>
            {animal.feedingFrequency && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
              Prochain prévu le: {nextMealDate ? nextMealDate.toLocaleDateString() : 'N/A'}
            </div>}
          </div>
          <button onClick={handleFeedNow} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
            🍖 IL A MANGÉ !
          </button>
        </div>
      </div>

      {activeTab === 'infos' && (
        <div className="no-print" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
             <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
               <Bone size={22} color="var(--primary)" /> Profil Biologique
             </h3>
             
             <div style={{ marginBottom: '1.5rem' }}>
               <label>Nom Commun de l'Animal</label>
               <input 
                 list="common-list"
                 value={animal.commonName || ''} 
                 onChange={e => {
                   const val = e.target.value;
                   updateField('commonName', val);
                   const found = speciesList.find(s => s.common === val);
                   if (found) {
                     updateField('scientificName', found.scientific);
                     if (found.family) updateField('family', found.family);
                     if (found.subfamily) updateField('subfamily', found.subfamily);
                     if (found.category) updateField('category', found.category);
                   }
                 }} 
               />
               <datalist id="common-list">
                 {[...new Set(speciesList.map(s => s.common))].sort().map((c, idx) => (
                   <option key={idx} value={c} />
                 ))}
               </datalist>
             </div>

             <div style={{ marginBottom: '1.5rem' }}>
               <label>Espèce / Nom Scientifique</label>
               <input 
                 list="species-list"
                 value={animal.scientificName || ''} 
                 onChange={e => {
                   const val = e.target.value;
                   updateField('scientificName', val);
                   const found = speciesList.find(s => s.scientific === val);
                   if (found) {
                     updateField('commonName', found.common);
                     if (found.family) updateField('family', found.family);
                     if (found.subfamily) updateField('subfamily', found.subfamily);
                     if (found.category) updateField('category', found.category);
                   }
                 }} 
                 placeholder="Ex: Correlophus ciliatus"
                 style={{ fontStyle: 'italic' }}
               />
               <datalist id="species-list">
                 {[...new Set(speciesList.map(s => s.scientific))].sort().map((s, idx) => (
                   <option key={idx} value={s} />
                 ))}
               </datalist>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div style={{ marginBottom: '1.5rem' }}>
                 <label>Famille</label>
                 <input 
                   value={animal.family || ''} 
                   onChange={e => updateField('family', e.target.value)} 
                   placeholder="Ex: Lacertidae"
                 />
               </div>
               <div style={{ marginBottom: '1.5rem' }}>
                 <label>Sous-Famille</label>
                 <input 
                   value={animal.subfamily || ''} 
                   onChange={e => updateField('subfamily', e.target.value)} 
                   placeholder="Ex: Lacertinae"
                 />
               </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label>Sexe</label>
                  <select 
                    value={animal.sex || 'inconnu'} 
                    onChange={e => updateField('sex', e.target.value)}
                  >
                    <option value="inconnu">Indéterminé</option>
                    <option value="male">Mâle (♂)</option>
                    <option value="femelle">Femelle (♀)</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label>Statut</label>
                  <select 
                    value={animal.status || 'vivant'} 
                    onChange={e => updateField('status', e.target.value)}
                  >
                    <option value="vivant">Vivant</option>
                    <option value="décédé">Décédé</option>
                    <option value="vendu">Vendu / Cédé</option>
                    <option value="malade">Malade</option>
                  </select>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Régime Alimentaire Type (Action Rapide)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label>Proie Habituelle</label>
                    <select value={animal.defaultFoodId || ''} onChange={e => updateField('defaultFoodId', e.target.value)}>
                      <option value="">Sélectionner une proie...</option>
                      {foods.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Qté (par repas)</label>
                    <input type="number" min="1" value={animal.defaultFoodQuantity || 1} onChange={e => updateField('defaultFoodQuantity', parseInt(e.target.value) || 1)} />
                  </div>
                  <div>
                     <label>Fréquence (jours)</label>
                     <input 
                       type="number" 
                       min="1"
                       placeholder="Ex: 7"
                       value={animal.feedingFrequency || ''} 
                       onChange={e => updateField('feedingFrequency', parseInt(e.target.value) || '')} 
                     />
                  </div>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label>Date de naissance</label>
                  <input 
                    type="date"
                    value={animal.birthDate || ''} 
                    onChange={e => updateField('birthDate', e.target.value)}
                    disabled={animal.birthDateUnknown}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.8rem' }}>
                  <input 
                    type="checkbox" 
                    id="birthUnknown"
                    checked={animal.birthDateUnknown || false}
                    onChange={e => updateField('birthDateUnknown', e.target.checked)}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="birthUnknown" style={{ margin: 0, textTransform: 'none', fontWeight: 400 }}>Date inconnue</label>
                </div>
             </div>

             <div style={{ marginBottom: '1.5rem', background: 'rgba(255, 107, 0, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 107, 0, 0.2)' }}>
               <label style={{ color: '#ff6b00', fontWeight: 800 }}>SURNOM DE L'ANIMAL (Visual ID)</label>
               <input 
                 value={animal.nickname || ''} 
                 onChange={e => updateField('nickname', e.target.value)} 
                 placeholder="Ex: REX, KAA..."
                 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ff6b00', textTransform: 'uppercase' }}
               />
             </div>
             
             <div style={{ marginBottom: '1.5rem' }}>
               <label>Mutation / Groupe de couleur</label>
               <input 
                 value={animal.mutation || ''} 
                 onChange={e => updateField('mutation', e.target.value)} 
                 placeholder="Ex: Albino, Pied-ball..."
               />
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
               <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                 <MapPin size={22} color="var(--secondary)" /> Assignation Habitat
               </h3>
               <label>Terrarium Actuel</label>
               <select 
                 value={animal.terrariumId || ''} 
                 onChange={e => updateField('terrariumId', e.target.value)}
                 style={{ marginBottom: '1.5rem' }}
               >
                 <option value="">-- Non assigné à un habitat --</option>
                 {terrariums.map(t => (
                   <option key={t.id} value={t.id}>{t.name || `Habitat ${t.id.substring(0, 4)}`}</option>
                 ))}
               </select>
            </div>
            
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
               <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                 <Camera size={22} color="var(--warning)" /> Identification Visuelle
               </h3>
               <div style={{ marginBottom: '1.5rem' }}>
                 <label>URL de la Photo d'Identification</label>
                 <input 
                   placeholder="Ex: https://images.unsplash.com/photo-1549480017-d76466a4b7e8"
                   value={animal.photoUrl || ''} 
                   onChange={e => updateField('photoUrl', e.target.value)} 
                 />
               </div>
               <div style={{ border: '1px solid var(--border-light)', minHeight: '150px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                  {animal.photoUrl || (animal.commonName || animal.scientificName) ? (
                    <img 
                      src={animal.photoUrl || (getPlaceholderImage(animal).replace('600', '1200'))} 
                      alt="Preview" 
                      style={{ width: '100%', height: '350px', objectFit: 'cover' }} 
                      onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8'}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <Camera size={32} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aperçu de la photo officielle</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'legal' && (
        <div className="no-print animate-fade-in glass-panel" style={{ padding: '2.5rem' }}>
           <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
             <Shield size={22} color="var(--primary)" /> Statut Réglementaire et CITES
           </h3>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
             <div>
                 <label>Statut CITES / UE et Régime</label>
                 <select 
                   value={animal.citesStatus || ''} 
                   onChange={e => {
                     const val = e.target.value;
                     let eu = '';
                     let regime = '';
                     if (val === 'annexe_1') { eu = 'annexe_A'; regime = 'cdc'; }
                     else if (val === 'annexe_2') { eu = 'annexe_B'; regime = 'declaration'; }
                     else if (val === 'annexe_3') { eu = 'annexe_C'; regime = 'libre'; }
                     
                     setAnimal({
                       ...animal,
                       citesStatus: val,
                       euStatus: eu,
                       detentionRegime: regime
                     });
                   }}
                 >
                   <option value="">-- Sélectionner l'Annexe CITES --</option>
                   <option value="annexe_1">CITES Annexe I (Espèces menacées)</option>
                   <option value="annexe_2">CITES Annexe II (Commerce contrôlé)</option>
                   <option value="annexe_3">CITES Annexe III (Protection locale)</option>
                   <option value="nc">Non CITES (NC)</option>
                 </select>
              </div>
              <div>
                  <label>Code Source Officiel</label>
                  <select value={animal.sourceCode || 'C'} onChange={e => updateField('sourceCode', e.target.value)}>
                    <option value="W">W - Prélevé dans la nature (Wild)</option>
                    <option value="C">C - Né en captivité - Annexe A (Captive)</option>
                    <option value="F">F - Né en captivité - Annexe B/C/D (Born in cap.)</option>
                    <option value="R">R - Issu d'un établissement d'élevage (Ranched)</option>
                    <option value="U">U - Source inconnue (Unknown)</option>
                  </select>
               </div>
               <div>
                 <label>Numéro de marquage / CITES</label>
                 <input value={animal.citesNumber || ''} onChange={e => updateField('citesNumber', e.target.value)} placeholder="Ex: FR-23-01..." />
              </div>
             
             <div>
                <label>Statut UE (Règlement)</label>
                <select value={animal.euStatus || ''} onChange={e => updateField('euStatus', e.target.value)}>
                  <option value="">Aucun</option>
                  <option value="annexe_A">Annexe A</option>
                  <option value="annexe_B">Annexe B</option>
                  <option value="annexe_C">Annexe C</option>
                  <option value="annexe_D">Annexe D</option>
                </select>
             </div>
             
             <div>
                <label>Régime de Détention</label>
                <select value={animal.detentionRegime || ''} onChange={e => updateField('detentionRegime', e.target.value)}>
                  <option value="libre">Détention libre (pas de quota)</option>
                  <option value="declaration">Déclaration préfectorale stricte</option>
                  <option value="cdc">CDC et AOE requis</option>
                </select>
             </div>
           </div>

           <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '2rem 0' }} />
           
           <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>Identification de l'animal</h4>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
             <div>
                <label>Moyen d'identification</label>
                <select value={animal.idMethod || 'photo'} onChange={e => updateField('idMethod', e.target.value)}>
                  <option value="photo">Photo (sur papier millimétré)</option>
                  <option value="puce">Transpondeur (Puce)</option>
                  <option value="bague">Bague</option>
                </select>
             </div>
             <div>
                <label>Numéro d'identification</label>
                <input value={animal.idNumber || ''} onChange={e => updateField('idNumber', e.target.value)} placeholder="Ex: 250228123456789" />
             </div>
             <div>
                <label>Lieu anatomique d'insertion (si puce)</label>
                <input value={animal.idLocation || ''} onChange={e => updateField('idLocation', e.target.value)} placeholder="Ex: Tiers arrière gauche" />
             </div>
           </div>
           
           <div style={{ marginTop: '2rem' }}>
              <label>Notes Réglementaires Particulières</label>
              <textarea rows="3" value={animal.legalNotes || ''} onChange={e => updateField('legalNotes', e.target.value)} />
           </div>
        </div>
      )}

      {activeTab === 'entry' && (
        <div className="no-print animate-fade-in glass-panel" style={{ padding: '2.5rem' }}>
           <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
             <Truck size={22} color="var(--primary)" /> Fiche d'Entrée
           </h3>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
             <div>
                <label>Date d'entrée dans le cheptel</label>
                <input type="date" value={animal.entryDate || ''} onChange={e => updateField('entryDate', e.target.value)} />
             </div>
             <div>
                <label>Nature de l'entrée</label>
                <select value={animal.entryNature || 'achat'} onChange={e => updateField('entryNature', e.target.value)}>
                  <option value="achat">Achat</option>
                  <option value="don">Don / Cession gratuite</option>
                  <option value="echange">Échange</option>
                  <option value="naissance">Naissance dans mon élevage</option>
                  <option value="pret">Prêt d'élevage</option>
                </select>
             </div>
             <div>
                <label>Origine de l'animal</label>
                <select value={animal.origin || 'nc'} onChange={e => updateField('origin', e.target.value)}>
                  <option value="nc">Né en Captivité (NC)</option>
                  <option value="sauvage">Prélevé dans la nature (Sauvage)</option>
                  <option value="inconnue">Inconnue</option>
                </select>
             </div>
             <div>
                <label>Provenance (Eleveur / Animalerie)</label>
                <input value={animal.provenance || ''} onChange={e => updateField('provenance', e.target.value)} placeholder="Nom du contact ou du magasin" />
             </div>
             <div>
                <label>Prix d'Achat (€)</label>
                <input type="number" value={animal.purchasePrice || 0} onChange={e => updateField('purchasePrice', parseFloat(e.target.value))} />
             </div>
             <div>
                <label>Prix de Vente (€)</label>
                <input type="number" value={animal.salePrice || 0} onChange={e => updateField('salePrice', parseFloat(e.target.value))} />
             </div>
             <div style={{ gridColumn: '1 / -1' }}>
                <label>Justificatif d'entrée (N° Bon de Cession / Facture)</label>
                <input value={animal.entryJustification || ''} onChange={e => updateField('entryJustification', e.target.value)} />
             </div>
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="no-print animate-fade-in" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1.5fr' }}>
          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem' }}>
              <Plus size={20} color="var(--primary)" /> Nouvel Évènement
            </h3>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label>Type d'intervention</label>
                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
                  <option value="repas">🍖 Repas / Nourrissage</option>
                  <option value="mue">🐍 Mue / Exuviation</option>
                  <option value="pesée">⚖️ Pesée / Morphométrie</option>
                  <option value="maladie">💊 Traitement / Santé</option>
                  <option value="autre">📝 Autre observation</option>
                </select>
              </div>

              {newEvent.type === 'repas' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', background: 'rgba(78, 222, 163, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(78, 222, 163, 0.2)' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Proie</label>
                    <select value={newEvent.foodId} onChange={e => setNewEvent({...newEvent, foodId: e.target.value})}>
                      <option value="">Sélectionner une proie...</option>
                      {foods.map(f => (
                        <option key={f.id} value={f.id}>{f.name} (Stock: {f.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Quantité</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newEvent.quantity} 
                      onChange={e => setNewEvent({...newEvent, quantity: parseInt(e.target.value) || 1 })} 
                    />
                  </div>
                </div>
              )}

              {newEvent.type === 'pesée' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255, 185, 0, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 185, 0, 0.2)' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#ffb900' }}>Poids ({newEvent.weightUnit})</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="Ex: 45.5"
                      value={newEvent.weight} 
                      onChange={e => setNewEvent({...newEvent, weight: parseFloat(e.target.value) || '' })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#ffb900' }}>Unité</label>
                    <select value={newEvent.weightUnit} onChange={e => setNewEvent({...newEvent, weightUnit: e.target.value})}>
                      <option value="g">Grammes (g)</option>
                      <option value="kg">Kilogrammes (kg)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label>Date de l'évènement</label>
                <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
              </div>
              <div>
                <label>Notes & Commentaires</label>
                <textarea 
                  rows="3"
                  placeholder="Détails sur l'observation..." 
                  value={newEvent.notes} 
                  onChange={e => setNewEvent({...newEvent, notes: e.target.value})} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={18} /> Enregistrer l'évènement
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
              <ClipboardList size={22} color="var(--primary)" /> Historique des soins
            </h3>
            
            {(!animal.history || animal.history.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(9, 15, 21, 0.4)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-light)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Aucun évènement enregistré pour ce specimen.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '20px', top: 0, bottom: 0, width: '2px', background: 'var(--border-light)' }}></div>
                
                {animal.history.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', gap: '2rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      width: '42px', height: '42px', 
                      background: 'var(--bg-dark)', 
                      borderRadius: '12px',
                      border: '2px solid var(--border-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}>
                      {item.type === 'repas' && '🍖'}
                      {item.type === 'mue' && '🐍'}
                      {item.type === 'pesée' && '⚖️'}
                      {item.type === 'maladie' && '💊'}
                      {item.type === 'autre' && '📝'}
                    </div>
                    <div className="glass-card" style={{ flex: 1, padding: '1.25rem', cursor: 'default' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span className="badge" style={{ background: 'rgba(78, 222, 163, 0.1)', color: 'var(--primary)' }}>{item.type}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={12} /> {new Date(item.date).toLocaleDateString()}
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleEditEvent(item)}
                              title="Modifier" 
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: 0, cursor: 'pointer', opacity: 0.7 }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(item.id)}
                              title="Supprimer" 
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: 0, cursor: 'pointer', opacity: 0.7 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {item.type === 'repas' && item.foodName && (
                        <div style={{ marginBottom: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--primary)', fontSize: '0.85rem' }}>
                          🍗 <strong>Nourriture:</strong> {item.quantity}x {item.foodName}
                        </div>
                      )}

                      {item.type === 'pesée' && item.weight && (
                        <div style={{ marginBottom: '0.5rem', background: 'rgba(255,185,0,0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid #ffb900', fontSize: '0.9rem', fontWeight: 700 }}>
                          ⚖️ Poids: {item.weight} {item.weightUnit || 'g'}
                        </div>
                      )}

                      {item.notes && <p style={{ fontSize: '0.9rem', color: '#fff', opacity: 0.9 }}>{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

       {activeTab === 'docs' && (
        <div className="no-print animate-fade-in" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1.5fr' }}>
          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem' }}>
               <Plus size={20} color="var(--primary)" /> Nouveau Document
            </h3>
            <form onSubmit={handleAddDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label>Nom du document</label>
                <input 
                  required
                  placeholder="Ex: Certificat de cession #123"
                  value={newDoc.name} 
                  onChange={e => setNewDoc({...newDoc, name: e.target.value})} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Type</label>
                  <select value={newDoc.type} onChange={e => setNewDoc({...newDoc, type: e.target.value})}>
                    <option value="facture">Facture</option>
                    <option value="cession">Bon de cession</option>
                    <option value="cites">Permis CITES</option>
                    <option value="medical">Rapport vétérinaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label>Date doc.</label>
                  <input type="date" value={newDoc.date} onChange={e => setNewDoc({...newDoc, date: e.target.value})} />
                </div>
              </div>
              <div>
                <label>Référence / N°</label>
                <input 
                  placeholder="N° de facture ou dossier"
                  value={newDoc.ref} 
                  onChange={e => setNewDoc({...newDoc, ref: e.target.value})} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Save size={18} /> Ajouter aux archives
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
              <FileText size={22} color="var(--secondary)" /> Coffre-fort Numérique
            </h3>
            
            {(!animal.documents || animal.documents.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', background: 'rgba(9, 15, 21, 0.4)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-light)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Aucun document archivé pour ce specimen.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {animal.documents.map(doc => (
                  <div key={doc.id} className="glass-card" style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ width: '40px', height: '40px', background: doc.type === 'cites' || doc.type === 'cession' ? 'rgba(78, 222, 163, 0.1)' : 'rgba(5, 102, 217, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {doc.type === 'cites' || doc.type === 'cession' ? <Shield size={20} color="var(--primary)" /> : <FileText size={20} color="var(--secondary)" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {doc.name} 
                          <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', opacity: 0.8 }}>
                            {doc.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMG'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {doc.type.toUpperCase()} • {doc.ref || 'Sans réf.'} • {new Date(doc.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteDoc(doc.id)} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', opacity: 0.6, cursor: 'pointer' }}
                      aria-label="Supprimer le document"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="no-print animate-fade-in glass-panel" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
             <Zap size={22} color="var(--primary)" /> Configuration Webhook (Make / Zapier)
           </h3>
           <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
             Configurez une URL de Webhook pour transmettre instantanément l'intégralité de la fiche de cet animal (informations, réglementations, journal) au format JSON vers un scénario d'automatisation externe.
           </p>
           
           <div style={{ marginBottom: '2rem' }}>
              <label>URL du Webhook cible</label>
              <input 
                type="url"
                placeholder="Ex: https://hook.eu1.make.com/xxxxxxxxx"
                value={webhookUrl}
                onChange={e => saveWebhookUrl(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
           </div>

           <div style={{ padding: '1.5rem', background: 'rgba(78, 222, 163, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(78, 222, 163, 0.2)' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>Action Manuelle</h4>
              <button 
                onClick={handleSendToWebhook} 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', justifyContent: 'center' }}
                disabled={isSending || !webhookUrl}
              >
                {isSending ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Transmission en cours...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Send size={18} /> Transmettre la fiche ({animal.id.substring(0, 6)}) en JSON
                  </span>
                )}
              </button>
           </div>
        </div>
      )}

       {activeTab === 'analytics' && (
         <div className="no-print animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
           <div className="glass-panel" style={{ padding: '2.5rem' }}>
             <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
               <TrendingUp size={22} color="var(--primary)" /> Courbe de Croissance
             </h3>
             <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.5rem', borderRadius: 'var(--radius-md)', height: '400px', border: '1px solid var(--border-light)' }}>
               {(() => {
                 const weightData = (animal.history || [])
                   .filter(h => h.type === 'pesée' && h.weight)
                   .sort((a, b) => new Date(a.date) - new Date(b.date));

                 if (weightData.length < 2) {
                   return (
                     <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                       Il faut au moins 2 pesées pour générer un graphique.
                     </div>
                   );
                 }

                 const data = {
                   labels: weightData.map(h => new Date(h.date).toLocaleDateString()),
                   datasets: [{
                     label: 'Poids (g)',
                     data: weightData.map(h => h.weightUnit === 'kg' ? h.weight * 1000 : h.weight),
                     borderColor: '#00ffa3', 
                     backgroundColor: 'rgba(0, 255, 163, 0.1)',
                     fill: true,
                     tension: 0.4,
                     pointRadius: 6,
                     pointHoverRadius: 8,
                     pointBackgroundColor: '#00ffa3',
                     borderWidth: 3
                   }]
                 };

                 const options = {
                   responsive: true,
                   maintainAspectRatio: false,
                   plugins: {
                     legend: { display: false },
                     tooltip: {
                       backgroundColor: '#1a1f26',
                       titleColor: '#fff',
                       bodyColor: '#00ffa3',
                       borderColor: 'rgba(255,255,255,0.2)',
                       borderWidth: 1,
                       padding: 12
                     }
                   },
                   scales: {
                     y: {
                       grid: { color: 'rgba(128,128,128,0.1)' },
                       ticks: { 
                         color: '#888',
                         font: { weight: '600' }
                       }
                     },
                     x: {
                       grid: { display: false },
                       ticks: { 
                         color: '#888',
                         font: { weight: '600' }
                       }
                     }
                   }
                 };

                 return <Line data={data} options={options} />;
               })()}
             </div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
             <div className="glass-panel" style={{ padding: '2rem' }}>
               <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                 <Calendar size={20} color="var(--primary)" /> Fréquence des Mues
               </h3>
               {(() => {
                 const mues = (animal.history || [])
                   .filter(h => h.type === 'mue')
                   .sort((a, b) => new Date(b.date) - new Date(a.date));

                 const currentYear = new Date().getFullYear();
                 const muesThisYear = mues.filter(m => new Date(m.date).getFullYear() === currentYear);

                 return (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                       <div>
                         <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{muesThisYear.length}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mues en {currentYear}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{mues.length}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mues totales</div>
                       </div>
                     </div>
                     
                     <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                       <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Dernières occurrences :</h4>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {mues.slice(0, 5).map(m => (
                           <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                             <span>🐍 Mue enregistrée</span>
                             <span style={{ color: 'var(--primary)' }}>{new Date(m.date).toLocaleDateString()}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 );
               })()}
             </div>

             <div className="glass-panel" style={{ padding: '2rem' }}>
               <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                 <Scale size={20} color="var(--primary)" /> Stats Morphologiques
               </h3>
               {(() => {
                 const pesées = (animal.history || [])
                   .filter(h => h.type === 'pesée' && h.weight)
                   .sort((a, b) => new Date(b.date) - new Date(a.date));

                 if (pesées.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Aucune donnée de poids.</p>;

                 const current = pesées[0];
                 const previous = pesées[1];
                 const weightInG = current.weightUnit === 'kg' ? current.weight * 1000 : current.weight;
                 const prevWeightInG = previous ? (previous.weightUnit === 'kg' ? previous.weight * 1000 : previous.weight) : null;
                 const diff = prevWeightInG ? (weightInG - prevWeightInG) : 0;

                 return (
                   <div style={{ textAlign: 'center' }}>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Poids Actuel</div>
                     <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{weightInG} <span style={{ fontSize: '1rem', color: 'var(--primary)' }}>g</span></div>
                     
                     {prevWeightInG && (
                       <div style={{ 
                         marginTop: '1rem', 
                         display: 'inline-flex', 
                         alignItems: 'center', 
                         gap: '0.5rem', 
                         padding: '0.5rem 1rem', 
                         borderRadius: 'var(--radius-full)',
                         background: diff >= 0 ? 'rgba(78,222,163,0.1)' : 'rgba(255,82,82,0.1)',
                         color: diff >= 0 ? 'var(--secondary)' : '#ff5252',
                         fontWeight: 700
                       }}>
                         {diff >= 0 ? '+' : ''}{diff} g depuis la dernière pesée
                       </div>
                     )}
                   </div>
                 );
               })()}
             </div>
           </div>
         </div>
       )}

      {/* ZONE D'IMPRESSION (Formulaire Officiel) */}
      <div className="print-only">
        <div className="official-header">
           <div>
              <h1 style={{ color: '#000', margin: 0, fontSize: '1.8rem', textTransform: 'uppercase' }}>Fiche d'Identification de l'Animal</h1>
              <p style={{ color: '#333', fontSize: '0.9rem', marginTop: '5px' }}>Règlement (CE) n° 338/97 & Convention de Washington (CITES)</p>
           </div>
           <div className="official-stamp">REPTIL-TRACK ORIGINAL</div>
        </div>

        <div style={{ marginBottom: '2rem', overflow: 'hidden' }}>
          {animal.photoUrl && (
            <div className="photo-placeholder-print">
               <img src={animal.photoUrl} alt="Photo ID" style={{ maxWidth: '100%', maxHeight: '100%' }} />
            </div>
          )}
          <p><strong>Date d'édition :</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>ID Specimen Unique :</strong> {animal.id.toUpperCase()}</p>
        </div>

        <h2 style={{ fontSize: '1.1rem', backgroundColor: '#eee', padding: '5px 10px', marginBottom: '10px' }}>I. IDENTITÉ DU SPÉCIMEN</h2>
        <table className="print-table">
          <tbody>
            <tr><th width="35%">Nom Commun</th><td>{animal.commonName}</td></tr>
            <tr><th>Nom Scientifique</th><td><em>{animal.scientificName || '/'}</em></td></tr>
            <tr><th>Famille / Sous-famille</th><td>{animal.family || '/'} {animal.subfamily ? `(${animal.subfamily})` : ''}</td></tr>
            <tr><th>Surnom / Code Interne</th><td>{animal.nickname || '/'}</td></tr>
            <tr><th>Sexe</th><td>{animal.sex === 'male' ? 'Mâle' : animal.sex === 'femelle' ? 'Femelle' : 'Indéterminé'}</td></tr>
            <tr><th>Date de Naissance / Éclosion</th><td>{animal.birthDateUnknown ? 'Inconnue' : (animal.birthDate || 'Non renseignée')}</td></tr>
            <tr><th>Mutation / Description</th><td>{animal.mutation || '/'}</td></tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: '1.1rem', backgroundColor: '#eee', padding: '5px 10px', marginBottom: '10px' }}>II. STATUT RÉGLEMENTAIRE ET CITES</h2>
        <table className="print-table">
          <tbody>
            <tr><th>Statut CITES</th><td>{animal.citesStatus ? animal.citesStatus.toUpperCase().replace('_', ' ') : 'Aucun'}</td></tr>
            <tr><th>Numéro de Permis CITES</th><td>{animal.citesNumber || '/'}</td></tr>
            <tr><th>Source Officielle</th><td>{animal.sourceCode || 'C'} ({animal.sourceCode === 'W' ? 'Sauvage' : animal.sourceCode === 'C' ? 'Capitvité A' : animal.sourceCode === 'F' ? 'Captivité B/C' : 'Inconnue'})</td></tr>
            <tr><th>Statut UE (Annexe)</th><td>{animal.euStatus ? animal.euStatus.replace('annexe_', 'Annexe ') : 'Aucun'}</td></tr>
            <tr><th>Moyen d'identification</th><td>{animal.idMethod === 'photo' ? 'Photographie' : animal.idMethod === 'puce' ? 'Transpondeur électronique' : 'Bague fermée'}</td></tr>
            <tr><th>Numéro d'identification</th><td>{animal.idNumber || '/'}</td></tr>
            <tr><th>Emplacement du marquage</th><td>{animal.idLocation || '/'}</td></tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: '1.1rem', backgroundColor: '#eee', padding: '5px 10px', marginBottom: '10px' }}>III. ORIGINE ET ENTRÉE DANS LE CHEPTEL</h2>
        <table className="print-table">
          <tbody>
            <tr><th width="35%">Date d'entrée</th><td>{animal.entryDate || '/'}</td></tr>
            <tr><th>Nature de l'entrée</th><td>{animal.entryNature || '/'}</td></tr>
            <tr><th>Source (W, C, F, R)</th><td>{animal.origin === 'nc' ? 'Né en captivité (C)' : animal.origin === 'sauvage' ? 'Prélevé (W)' : 'Inconnue (U)'}</td></tr>
            <tr><th>Provenance (Cédant)</th><td>{animal.provenance || '/'}</td></tr>
            <tr><th>Réf. justificatif de cession</th><td>{animal.entryJustification || '/'}</td></tr>
          </tbody>
        </table>
        
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #000', fontSize: '0.9rem' }}>
          <strong>Observations et notes réglementaires :</strong>
          <p style={{ marginTop: '0.5rem' }}>{animal.legalNotes || 'Néant.'}</p>
        </div>
        
        <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '45%', borderBottom: '1px solid #000', paddingBottom: '3rem' }}>Signature du détenteur cédant</div>
          <div style={{ width: '45%', borderBottom: '1px solid #000', paddingBottom: '3rem' }}>Signature du détenteur cessionnaire</div>
        </div>
      </div>

    </div>
  );
}
