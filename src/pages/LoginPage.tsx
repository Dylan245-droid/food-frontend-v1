import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Eye, EyeOff, Send, Key } from 'lucide-react';
import { showToast } from '../utils/toast';

type LoginMode = 'password' | 'otp' | 'forgot';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [mode, setMode] = useState<LoginMode>('password');
    const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');

    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLoginSuccess = (user: any, token: string) => {
        login(token, user);
        if (user.role === 'super_admin' && !user.tenantId) {
            navigate('/admin/super');
        } else if (user.role === 'livreur') {
            navigate('/delivery');
        } else {
            navigate('/admin');
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            handleLoginSuccess(res.data.user, res.data.token);
        } catch (err: any) {
            if (err.response?.data?.isNotActivated) {
                setError('Votre compte n\'est pas activé. Vérifiez vos emails.');
            } else {
                setError('Email ou mot de passe incorrect.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/otp/request', { email });
            setOtpStep('verify');
            showToast.success('Code envoyé par email.');
        } catch (err: any) {
            showToast.error(err.response?.data?.message || 'Erreur lors de l\'envoi du code.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/otp/login', { email, code: otp });
            handleLoginSuccess(res.data.user, res.data.token);
        } catch (err: any) {
            showToast.error(err.response?.data?.message || 'Code invalide ou expiré.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            showToast.success('Lien de récupération envoyé !');
            setMode('password');
        } catch (err: any) {
            showToast.error(err.response?.data?.message || 'Erreur lors de l\'envoi.');
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
                        <img src="/logo_dark.png" alt="GoTchop" className="h-16 md:h-20 mx-auto" />
                    </div>
                    <h2 className="mt-4 text-center text-2xl font-black text-white tracking-tight">
                        GoTchop <span className="text-orange-500">Admin</span>
                    </h2>
                    <p className="mt-1 text-center text-xs text-gray-400">
                        {mode === 'password' && "Gérez votre empire culinaire."}
                        {mode === 'otp' && "Connexion sécurisée sans mot de passe."}
                        {mode === 'forgot' && "Récupération de votre compte."}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 py-5 md:py-6 px-4 shadow-2xl rounded-2xl sm:px-8 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 to-red-600 opacity-50" />

                    {/* PASSWORD MODE */}
                    {mode === 'password' && (
                        <form className="space-y-6" onSubmit={handlePasswordLogin}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-sm text-red-400 font-medium">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm"
                                        placeholder="votre@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Mot de passe</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <button type="button" onClick={() => setMode('otp')} className="text-xs text-orange-500 hover:text-orange-400 font-bold cursor-pointer">
                                    Connexion sans mot de passe
                                </button>
                                <button type="button" onClick={() => setMode('forgot')} className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">
                                    Oublié ?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg shadow-lg hover:from-orange-500 hover:to-red-500 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? 'Connexion...' : 'Accéder au Dashboard'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </button>
                        </form>
                    )}

                    {/* OTP MODE */}
                    {mode === 'otp' && (
                        <div className="space-y-6">
                            {otpStep === 'request' ? (
                                <form onSubmit={handleRequestOtp} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm"
                                                placeholder="votre@email.com"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-3 px-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all cursor-pointer"
                                    >
                                        {loading ? 'Envoi...' : 'Envoyer mon code'}
                                        <Send className="ml-2 h-4 w-4" />
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Code reçu</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Key className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white focus:outline-none focus:border-orange-500 text-center text-xl tracking-[10px]"
                                                placeholder="000000"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2 text-center italic">Le code a été envoyé à {email}</p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg cursor-pointer"
                                    >
                                        {loading ? 'Vérification...' : 'Continuer'}
                                    </button>
                                    <button type="button" onClick={() => setOtpStep('request')} className="w-full text-xs text-gray-500 hover:text-white cursor-pointer">
                                        Renvoyer un code
                                    </button>
                                </form>
                            )}
                            <button onClick={() => setMode('password')} className="w-full text-xs text-orange-500 font-bold cursor-pointer">
                                Retour au mot de passe
                            </button>
                        </div>
                    )}

                    {/* FORGOT MODE */}
                    {mode === 'forgot' && (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email de récupération</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm"
                                        placeholder="votre@email.com"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                {loading ? 'Envoi...' : 'Récupérer mon accès'}
                            </button>
                            <button onClick={() => setMode('password')} className="w-full text-xs text-orange-500 font-bold cursor-pointer">
                                Se connecter
                            </button>
                        </form>
                    )}

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
