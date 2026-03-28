import { useAppContext } from '../store/AppContext';
import { calculateDailyCost, formatCurrency } from '../utils/costCalculator';
import { Euro, TrendingUp, Zap, Home, Plug } from 'lucide-react';
import { Snake } from '../components/icons/Snake';
import { speciesList } from '../data/species';

export function Finances() {
  const { animals, terrariums, equipments, settings } = useAppContext();

  const animalInvestment = animals.reduce((s, a) => s + (a.purchasePrice || 0), 0);
  const animalResaleValue = animals.reduce((s, a) => s + (a.salePrice || 0), 0);
  const terrariumInvestment = terrariums.reduce((s, t) => s + (t.purchasePrice || 0), 0);
  const terrariumResaleValue = terrariums.reduce((s, t) => s + (t.salePrice || 0), 0);
  const equipmentInvestment = equipments.reduce((s, e) => s + (e.purchasePrice || 0), 0);

  const totalInvestment = animalInvestment + terrariumInvestment + equipmentInvestment;
  const totalResalePotential = animalResaleValue + terrariumResaleValue;
  const totalProfitPotential = (animalResaleValue - animalInvestment) + (terrariumResaleValue - terrariumInvestment);

  const totalDailyCost = equipments.reduce((sum, e) => sum + calculateDailyCost(e.watts, e.hoursPerDay, settings.kwhPrice), 0);

  return (
    <div className="animate-fade-in finances-page">
      <header style={{ marginBottom: '3rem' }}>
        <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Gestion du cheptel</p>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Bilan Financier</h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyse détaillée de vos investissements et coûts d'exploitation.</p>
      </header>

      {/* Résumé Global */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)', background: 'var(--primary-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>Investissement Total</span>
            <Euro size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{totalInvestment.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Valeur d'acquisition cumulée.</p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary)' }}>Valeur de Revente (A+T)</span>
            <TrendingUp size={20} color="var(--secondary)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{totalResalePotential.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          <div style={{ marginTop: '0.5rem', color: totalProfitPotential >= 0 ? 'var(--primary)' : 'var(--danger)', fontSize: '0.9rem', fontWeight: 700 }}>
             {totalProfitPotential >= 0 ? '+' : ''}{totalProfitPotential.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de PV latente
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)' }}>Coût d'Énergie Mensuel</span>
            <Zap size={20} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{(totalDailyCost * 30.416).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Basé sur {equipments.length} équipements actifs.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem' }}>
        
        {/* Breakdown par Catégorie */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
           <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
             <Euro size={22} color="var(--primary)" /> Détails de l'Investissement
           </h3>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ padding: '0.5rem', background: 'rgba(78, 222, 163, 0.1)', borderRadius: '8px' }}>
                     <Snake size={20} color="var(--primary)" />
                   </div>
                   <div>
                     <div style={{ fontWeight: 700 }}>Specimens</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{animals.length} animaux en stock</div>
                   </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontWeight: 800 }}>{animalInvestment.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Revente: {animalResaleValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ padding: '0.5rem', background: 'rgba(173, 198, 255, 0.1)', borderRadius: '8px' }}>
                     <Home size={20} color="var(--secondary)" />
                   </div>
                   <div>
                     <div style={{ fontWeight: 700 }}>Habitats & Terrariums</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{terrariums.length} structures actives</div>
                   </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontWeight: 800 }}>{terrariumInvestment.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Revente: {terrariumResaleValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                     <Plug size={20} color="var(--warning)" />
                   </div>
                   <div>
                     <div style={{ fontWeight: 700 }}>Matériel Technique</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{equipments.length} équipements</div>
                   </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontWeight: 800 }}>{equipmentInvestment.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amortissement 100%</div>
                </div>
              </div>
           </div>
        </div>

        {/* Breakdown Opérationnel (Terrariums) */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
           <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
             <Zap size={22} color="var(--secondary)" /> Coûts d'Exploitation (Énergie)
           </h3>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {terrariums.map(t => {
                const tEquipments = equipments.filter(e => e.terrariumId === t.id);
                const dailyCost = tEquipments.reduce((sum, current) => {
                  return sum + calculateDailyCost(current.watts, current.hoursPerDay, settings.kwhPrice);
                }, 0);
                
                if (dailyCost === 0) return null;

                return (
                  <div key={t.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tEquipments.length} points de consommation</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{(dailyCost * 30.416).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}<span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>/mois</span></div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>{formatCurrency(dailyCost)}/j</div>
                    </div>
                  </div>
                );
              })}
              
              <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(5, 102, 217, 0.05)', borderRadius: '12px', border: '1px solid var(--secondary-glow)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800 }}>TOTAL ÉLECTRICITÉ (ESTIMÉ)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>
                       {(totalDailyCost * 30.416).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} / mois
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* Flux de Trésorerie Historique (Placeholder pour le moment car pas d'historique de paiement) */}
      <div className="glass-panel" style={{ marginTop: '3rem', padding: '2.5rem' }}>
         <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
           <TrendingUp size={22} color="var(--primary)" /> Projection de Croissance
         </h3>
         <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-light)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Module de projection financière en cours d'optimisation (V2.8 prévue).</p>
         </div>
      </div>
    </div>
  );
}
