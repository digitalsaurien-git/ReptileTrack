import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Plus, Search, Info, ShieldCheck, AlertCircle, ChevronRight, X } from 'lucide-react';
import { Snake } from '../components/icons/Snake' ;
import { getPlaceholderImage } from '../utils/imageUtils';
import { speciesList } from '../data/species';

export function Animals() {
  const { animals, setAnimals } = useAppContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const familyFilter = searchParams.get('family');
  
  const filteredAnimals = animals.filter(a => {
    const matchesSearch = (
      a.commonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.chipNumber?.includes(searchTerm)
    );

    if (!familyFilter) return matchesSearch;

    const speciesData = speciesList.find(s => s.scientific === a.scientificName || s.common === a.commonName);
    return matchesSearch && speciesData?.family === familyFilter;
  });

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm('');
  };

  const handleQuickAdd = () => {
    const newId = crypto.randomUUID();
    setAnimals([...animals, {
      id: newId,
      commonName: 'Espèce non renseignée',
      scientificName: '',
      chipNumber: '',
      terrariumId: null,
      status: 'vivant',
      purchasePrice: 0,
      salePrice: 0,
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
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flex: 1 }}>
            <Search size={22} color="var(--primary)" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, espèce ou numéro de puce..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: 0, width: '100%' }}
            />
          </div>
          {familyFilter && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'var(--primary-glow)', 
              padding: '0.4rem 1rem', 
              borderRadius: '20px',
              border: '1.5px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              <span>Famille: {familyFilter}</span>
              <button onClick={clearFilters} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                <X size={16} color="var(--primary)" />
              </button>
            </div>
          )}
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
              style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: '320px', border: '1px solid var(--border-light)', overflow: 'hidden' }}
            >
              <div style={{ height: '160px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src={animal.photoUrl || getPlaceholderImage(animal)} 
                  alt={animal.commonName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                  className="animal-card-img"
                />
                <span className="badge" style={{ 
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: animal.status === 'vivant' ? 'rgba(78, 222, 163, 0.9)' : 'rgba(255,255,255,0.8)', 
                  color: animal.status === 'vivant' ? 'var(--text-on-primary)' : '#333',
                  fontSize: '0.65rem'
                }}>
                  {animal.status || 'vivant'}
                </span>
              </div>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.1rem', color: '#ff6b00', fontWeight: 800, textTransform: 'uppercase' }}>
                    {animal.nickname || animal.commonName || 'Specimen'}
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-heading)', opacity: 0.8 }}>
                    {animal.commonName} {animal.scientificName ? `(${animal.scientificName})` : ''}
                  </p>
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
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{animal.history?.length || 0} obs.</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Consulter la fiche</span>
                    <ChevronRight size={18} color="var(--primary)" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
