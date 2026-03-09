import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { showToast } from '../utils/toast';

const ActivateAccountPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Activation de votre compte en cours...');

    useEffect(() => {
        const activateAccount = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Lien d\'activation invalide (token manquant).');
                return;
            }

            try {
                const response = await api.post('/auth/activate', { token });
                setStatus('success');
                setMessage(response.data.message || 'Votre compte a été activé avec succès !');
                showToast.success('Compte activé !');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Erreur lors de l\'activation de votre compte.');
            }
        };

        activateAccount();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden px-4">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl rounded-2xl text-center">
                    <div className="flex justify-center mb-6">
                        {status === 'loading' && (
                            <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
                        )}
                        {status === 'success' && (
                            <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
                                <XCircle className="h-10 w-10 text-red-500" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-black text-white mb-4">
                        {status === 'loading' ? 'Activation...' : status === 'success' ? 'Compte Activé !' : 'Oups !'}
                    </h2>

                    <p className="text-gray-400 mb-8">
                        {message}
                    </p>

                    {(status === 'success' || status === 'error') && (
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition-all cursor-pointer"
                        >
                            {status === 'success' ? 'Me connecter' : 'Retour à la page de connexion'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivateAccountPage;
