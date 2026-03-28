import { useAppContext } from '../store/AppContext';
import { calculateDailyCost, formatCurrency } from '../utils/costCalculator';
import { Zap, Box, Activity, TrendingUp } from 'lucide-react';
import { Snake } from '../components/icons/Snake';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { animals, terrariums, equipments, settings } = useAppContext();
  const navigate = useNavigate();

  const totalCostDay = equipments.reduce((sum, e) => sum + calculateDailyCost(e.watts, e.hoursPerDay, settings.kwhPrice), 0);
  
  const allEvents = animals.flatMap(a => 
    (a.history || []).map(event => ({ ...event, animalName: a.commonName || 'Inconnu', animalId: a.id }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '3rem' }}>
        <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Vue d'ensemble</p>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Le Dashboard du Conservateur</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gérez votre collection avec précision et soin.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        
        <div className="glass-card" onClick={() => navigate('/animals')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(78, 222, 163, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Snake size={24} color="var(--primary)" />
            </div>
            <TrendingUp size={16} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{animals.length}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Specimens enregistrés</p>
          </div>
        </div>

        <div className="glass-card" onClick={() => navigate('/terrariums')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(173, 198, 255, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Box size={24} color="var(--secondary)" />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{terrariums.length}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Habitats actifs</p>
          </div>
        </div>

        <div className="glass-card" onClick={() => navigate('/equipments')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Zap size={24} color="var(--warning)" />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-main)' }}>{formatCurrency(totalCostDay)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ jour</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Estimation énergétique</p>
            <div style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', display: 'inline-block', fontSize: '0.75rem' }}>
              {formatCurrency(totalCostDay * 30.416)} mensuel
            </div>
          </div>
        </div>

      </div>

      <div className="glass-panel" style={{ marginBottom: '4rem', padding: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', marginBottom: '2rem' }}>
          <Activity size={24} color="var(--primary)" /> État de la collection (Focus Espèces)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(animals.reduce((acc, curr) => {
            const species = curr.commonName || 'Inconnu';
            acc[species] = (acc[species] || 0) + 1;
            return acc;
          }, {})).sort((a,b) => b[1] - a[1]).map(([species, count]) => (
            <div key={species} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{species}</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 800, color: species.toLowerCase().includes('python') ? 'var(--secondary)' : (species.toLowerCase().includes('gecko') ? 'var(--primary)' : '#fff') }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ background: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
            <Activity size={24} color="var(--primary)" /> Flux d'activité
          </h3>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Tout voir</button>
        </div>
        
        {allEvents.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', cursor: 'default' }}>
            <p style={{ color: 'var(--text-muted)' }}>Aucune observation enregistrée pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
            {allEvents.map(event => (
              <div 
                key={event.id} 
                className="glass-card"
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '1.25rem'
                }}
                onClick={() => navigate(`/animals/${event.animalId}`)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge" style={{ background: 'var(--bg-dark)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>{event.type}</span>
                    <strong style={{ color: '#fff' }}>{event.animalName}</strong>
                  </div>
                  {event.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{event.notes}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.8 }}>Détails →</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
