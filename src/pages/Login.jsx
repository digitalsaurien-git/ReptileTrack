import { useAppContext } from "../store/AppContext";
import { Snake } from "../components/icons/Snake";
import { LogIn } from "lucide-react";

export function Login() {
  const { loginWithGoogle, theme } = useAppContext();

  return (
    <div className={`app-container ${theme === 'light' ? 'light-mode' : ''}`} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      width: '100vw'
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        maxWidth: '400px', 
        textAlign: 'center',
        padding: '3rem'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <Snake color="var(--primary)" size={64} />
        </div>
        
        <h1 style={{ marginBottom: '0.5rem' }}>ReptilTrack</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          Gérez votre collection, vos terrariums et vos stocks en toute simplicité.
        </p>

        <button 
          onClick={loginWithGoogle} 
          className="btn btn-primary"
          style={{ width: '100%', padding: '1rem', gap: '1rem' }}
        >
          <LogIn size={20} />
          Se connecter avec Google
        </button>

        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2rem' }}>
          Vos données seront automatiquement synchronisées sur tous vos appareils.
        </p>
      </div>
    </div>
  );
}
