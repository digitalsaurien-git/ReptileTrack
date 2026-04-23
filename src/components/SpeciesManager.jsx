import { useState, useMemo } from "react";
import { Search, Plus, Check, X, ShieldAlert, Globe, Star } from "lucide-react";
import { useAppContext } from "../store/AppContext";
import speciesMaster from "../data/species_master.json";

export function SpeciesManager({ onClose }) {
  const { mySpecies, toggleSpecies, addCustomSpecies, updateSpecies } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newSpecies, setNewSpecies] = useState({
    scientificName: "",
    commonName: "",
    family: "",
    subfamily: ""
  });

  // Filtrage du catalogue maître
  const filteredMaster = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return speciesMaster.filter(s => 
      s.scientific_name.toLowerCase().includes(term) || 
      s.common_name.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleAddCustom = () => {
    if (!newSpecies.scientificName) return;
    addCustomSpecies(newSpecies);
    setNewSpecies({ scientificName: "", commonName: "", family: "", subfamily: "" });
    setShowAddCustom(false);
  };

  const [isPersonalExpanded, setIsPersonalExpanded] = useState(true);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)', 
      width: '95%', 
      maxWidth: '600px', 
      maxHeight: '85vh', 
      display: 'flex', 
      flexDirection: 'column',
      zIndex: 2000,
      padding: '1.5rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      border: '1px solid var(--border-light)',
      background: 'var(--bg-card)',
      borderRadius: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontSize: '1.25rem' }}>
          <Globe size={24} />
          Catalogue d'espèces
        </h3>
        <X size={24} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={onClose} />
      </div>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
        <input 
          type="text" 
          placeholder="Rechercher une espèce (ex: Gonyosoma, Pituophis...)" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '0.8rem 1rem 0.8rem 3rem', 
            background: 'var(--bg-dark)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '1rem',
            outline: 'none',
            caretColor: 'var(--primary)'
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
        {searchTerm && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Résultats du catalogue maître</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredMaster.map(s => {
                const isActive = mySpecies.some(ms => ms.scientificName === s.scientific_name && ms.isActive);
                return (
                  <div key={s.scientific_name} style={{ padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{s.scientific_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.common_name} • {s.family}</div>
                    </div>
                    <button 
                      onClick={() => toggleSpecies(s, !isActive)}
                      className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      {isActive ? "Activée" : "Activer"}
                    </button>
                  </div>
                );
              })}
              {filteredMaster.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  Aucune espèce trouvée.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
          <h4 
            onClick={() => setIsPersonalExpanded(!isPersonalExpanded)}
            style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)', 
              background: 'rgba(255,255,255,0.03)',
              padding: '0.8rem 1rem',
              margin: 0,
              textTransform: 'uppercase', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isPersonalExpanded ? <Check size={14} /> : <Plus size={14} />}
              Ma sélection personnelle ({mySpecies.filter(s => s.isActive).length} active(s))
            </div>
            <span style={{ fontSize: '0.7rem' }}>{isPersonalExpanded ? 'Réduire' : 'Afficher'}</span>
          </h4>
          
          {isPersonalExpanded && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              maxHeight: '350px',
              overflowY: 'auto'
            }}>
              {mySpecies.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Votre catalogue est vide.
                </div>
              )}
              {mySpecies.map((s, index) => (
                <div 
                  key={s.id} 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderBottom: index !== mySpecies.length - 1 ? '1px solid var(--border-light)' : 'none',
                    opacity: s.isActive ? 1 : 0.6
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{s.scientificName}</span>
                      {s.isCustom && <Star size={10} color="var(--warning)" fill="var(--warning)" />}
                    </div>
                    <input 
                      type="text" 
                      value={s.commonName} 
                      placeholder="Ajouter un nom commun..."
                      onChange={(e) => updateSpecies(s.id, { commonName: e.target.value })}
                      style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)', 
                        background: 'transparent', 
                        border: 'none', 
                        borderBottom: '1px solid transparent', 
                        padding: 0, 
                        width: '100%', 
                        caretColor: 'var(--primary)', 
                        outline: 'none',
                        marginTop: '2px'
                      }}
                      onFocus={(e) => e.target.style.borderBottom = '1px solid var(--primary)'}
                      onBlur={(e) => e.target.style.borderBottom = '1px solid transparent'}
                    />
                  </div>
                  <button 
                    onClick={() => updateSpecies(s.id, { isActive: !s.isActive })}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: s.isActive ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      marginLeft: '1rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {s.isActive ? <Check size={14} /> : <X size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
        {!showAddCustom ? (
          <button 
            onClick={() => setShowAddCustom(true)}
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Ajouter une espèce personnalisée
          </button>
        ) : (
          <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-main)' }}>Nouvelle espèce sur mesure</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { key: 'scientificName', placeholder: 'Nom scientifique *' },
                { key: 'commonName', placeholder: 'Nom commun' },
                { key: 'family', placeholder: 'Famille' },
                { key: 'subfamily', placeholder: 'Sous-famille' }
              ].map(f => (
                <input 
                  key={f.key}
                  placeholder={f.placeholder} 
                  value={newSpecies[f.key]}
                  onChange={e => setNewSpecies({...newSpecies, [f.key]: e.target.value})}
                  style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-light)', 
                    padding: '0.5rem', 
                    borderRadius: '4px', 
                    color: 'var(--text-main)', 
                    fontSize: '0.8rem',
                    outline: 'none',
                    caretColor: 'var(--primary)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleAddCustom} className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}>Enregistrer</button>
              <button onClick={() => setShowAddCustom(false)} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
