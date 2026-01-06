import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/admin');
    } catch (err: any) {
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border" style={{ borderColor: 'var(--border-light)' }}>
        
        {/* Logo/Header */}
        <div className="text-center mb-8">
          {branding.logo ? (
            <img src={branding.logo} alt={branding.name} className="h-16 mx-auto mb-4" />
          ) : (
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <ChefHat className="w-8 h-8" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-stone-900">{branding.name}</h1>
          <p className="text-stone-500 text-sm mt-1">Connexion Staff</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-all"
              style={{ 
                borderColor: 'var(--border-default)',
                '--tw-ring-color': 'var(--primary-400)'
              } as React.CSSProperties}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-all"
              style={{ 
                borderColor: 'var(--border-default)',
                '--tw-ring-color': 'var(--primary-400)'
              } as React.CSSProperties}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--primary-gradient)' }}
          >
            Se connecter
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="text-sm transition-colors"
              style={{ color: 'var(--primary-600)' }}
            >
                ← Retour à l'accueil
            </button>
        </div>
      </div>
    </div>
  );
}
