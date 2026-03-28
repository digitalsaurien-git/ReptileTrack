import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Plus, Search, Info, ShieldCheck, AlertCircle, ChevronRight, Home } from 'lucide-react';
import { Snake } from '../components/icons/Snake' ;

export function Animals() {
  const { animals, setAnimals } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredAnimals = animals.filter(a => 
    a.commonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.chipNumber?.includes(searchTerm)
  );

  const handleQuickAdd = () => {
    const newId = crypto.randomUUID();
    setAnimals([...animals, {
      id: newId,
      commonName: 'Espèce non renseignée',
      scientificName: '',
      chipNumber: '',
      terrariumId: null,
      status: 'vivant',
      history: [],
      documents: []
    }]);
    navigate(`/animals/${newId}`);
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(78, 222, 163, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
            <Snake size={32} color="var(--primary)" />
          </div>
          <div>
            <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Collection</p>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>Mes Specimens</h1>
            <p style={{ color: 'var(--text-muted)' }}>Documentation et suivi de santé de vos reptiles.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleQuickAdd}>
          <Plus size={20} />
          Ajouter un specimen
        </button>
      </header>

      <div className="glass-panel" style={{ marginBottom: '3rem', padding: '1.25rem 2rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Search size={22} color="var(--primary)" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, espèce ou numéro de puce..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: 0 }}
          />
        </div>
      </div>

      {filteredAnimals.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '6rem', color: 'var(--text-muted)' }}>
          <Info size={64} style={{ marginBottom: '1.5rem', opacity: 0.3, color: 'var(--primary)' }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Aucun specimen trouvé</h3>
          <p>Commencez par ajouter votre premier pensionnaire à la collection.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredAnimals.map(animal => (
            <div 
              key={animal.id} 
              className="glass-card"
              onClick={() => navigate(`/animals/${animal.id}`)}
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '200px', border: '1px solid var(--border-light)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                   <span className="badge" style={{ 
                      background: animal.status === 'vivant' ? 'rgba(78, 222, 163, 0.1)' : 'rgba(255,255,255,0.05)', 
                      color: animal.status === 'vivant' ? 'var(--primary)' : 'var(--text-muted)',
                      border: `1px solid ${animal.status === 'vivant' ? 'rgba(78, 222, 163, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                      marginBottom: '0.5rem',
                      display: 'inline-block',
                      fontSize: '0.65rem'
                    }}>
                      {animal.status || 'vivant'}
                    </span>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.1rem', color: '#ff6b00', fontWeight: 800, textTransform: 'uppercase' }}>
                    {animal.nickname || animal.commonName || 'Specimen'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-heading)', opacity: 0.8 }}>
                    {animal.commonName} {animal.scientificName ? `(${animal.scientificName})` : ''}
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  {animal.terrariumId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--secondary)' }}>
                      <ShieldCheck size={14} /> Habitat assigné
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
                      <AlertCircle size={14} /> Sans habitat
                    </div>
                  )}
                  <span style={{ fontSize: '1rem', color: 'var(--border-light)' }}>|</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{animal.history?.length || 0} observations</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Consulter la fiche</span>
                  <ChevronRight size={18} color="var(--primary)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
