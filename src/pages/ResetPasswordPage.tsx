import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { showToast } from '../utils/toast';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);

    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast.error("Les mots de passe ne correspondent pas.");
            return;
        }

        if (!token) {
            showToast.error("Token de réinitialisation manquant.");
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', { token, password });
            setSuccess(true);
            showToast.success('Mot de passe réinitialisé !');
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl rounded-2xl text-center">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-4">C'est tout bon !</h2>
                    <p className="text-gray-400 mb-8">Votre mot de passe a été mis à jour avec succès.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg cursor-pointer"
                    >
                        Me connecter
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden px-4">
            <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white">Nouveau mot de passe</h2>
                    <p className="text-gray-400 mt-2">Choisissez un mot de passe sécurisé.</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nouveau mot de passe</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="block w-full pl-10 pr-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white focus:outline-none focus:border-orange-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Confirmer le mot de passe</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white focus:outline-none focus:border-orange-500"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
