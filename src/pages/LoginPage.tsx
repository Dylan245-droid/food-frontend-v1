import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });
            const user = res.data.user;

            login(res.data.token, user);

            // Smart Redirection based on Role
            if (user.role === 'super_admin' && !user.tenantId) {
                // Platform Super Admin
                navigate('/admin/super');
            } else if (user.role === 'livreur') {
                // Driver Interface
                navigate('/delivery');
            } else {
                // Restaurant Admin / Staff
                navigate('/admin');
            }

        } catch (err: any) {
            console.error(err);
            setError('Email ou mot de passe incorrect.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white px-4">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-sm w-full space-y-4 relative z-10">
                {/* Header */}
                <div className="text-center group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="mx-auto transform group-hover:rotate-6 transition-transform duration-500">
                        <img src="/logo_dark.png" alt="GoTchop" className="h-20 mx-auto" />
                    </div>
                    <h2 className="mt-4 text-center text-2xl font-black text-white tracking-tight">
                        GoTchop <span className="text-orange-500">Admin</span>
                    </h2>
                    <p className="mt-1 text-center text-xs text-gray-400">
                        Gérez votre empire culinaire.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 py-6 px-4 shadow-2xl rounded-2xl sm:px-8 relative overflow-hidden">
                    {/* Gradient Border Top */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 to-red-600 opacity-50" />

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3">
                                <div className="p-1 bg-red-500 rounded-full shrink-0 animate-pulse">
                                    <span className="block w-2 h-2 bg-white rounded-full" />
                                </div>
                                <p className="text-sm text-red-400 font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                                    placeholder="votre@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-11 bg-black/50 border border-white/10 rounded-xl py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-600 rounded bg-black/50"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                                    Rester connecté
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-orange-500 hover:text-orange-400 transition-colors">
                                    Oublié ?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transform transition-all hover:-translate-y-1 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Connexion...' : 'Accéder au Dashboard'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-4 border-t border-white/5">
                        <p className="text-center text-xs text-gray-500 mb-3">Pas encore de compte ?</p>
                        <Link
                            to="/register"
                            className="w-full inline-flex justify-center py-2.5 px-4 border border-white/10 rounded-lg shadow-sm bg-white/5 text-sm font-bold text-white hover:bg-white hover:text-black transition-all"
                        >
                            Je lance mon activité
                        </Link>
                    </div>
                </div>

                <div className="text-center">
                    <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
