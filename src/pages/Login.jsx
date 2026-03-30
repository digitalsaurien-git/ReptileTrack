import { useState } from "react";
import { useAppContext } from "../store/AppContext";
import { Snake } from "../components/icons/Snake";
import { LogIn, Mail, Loader2 } from "lucide-react";

export function Login() {
  const { loginWithGoogle, loginWithEmail, theme } = useAppContext();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await loginWithEmail(email);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: "Lien envoyé ! Vérifiez votre boîte mail (pensez aux spams)." });
    }
    setLoading(false);
  };

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

        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label>Email</label>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              style={{ paddingLeft: '3rem' }}
            />
          </div>
          <button 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', gap: '0.75rem' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Mail size={18} />}
            M'envoyer un lien magique
          </button>
        </form>

        {message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            background: message.type === 'error' ? 'rgba(255,180,171,0.1)' : 'rgba(78,222,163,0.1)',
            color: message.type === 'error' ? 'var(--danger)' : 'var(--primary)',
            border: `1px solid ${message.type === 'error' ? 'var(--danger)' : 'var(--primary)'}`
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-light)' }} />
          <span style={{ margin: '0 1rem' }}>OU</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-light)' }} />
        </div>

        <button 
          onClick={loginWithGoogle} 
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.8rem', gap: '1rem' }}
        >
          <LogIn size={20} />
          Google (si configuré)
        </button>

        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2rem' }}>
          Vos données seront automatiquement synchronisées sur tous vos appareils.
        </p>
      </div>
    </div>
  );
}
