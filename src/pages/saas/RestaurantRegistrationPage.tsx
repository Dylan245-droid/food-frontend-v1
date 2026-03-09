import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { showToast } from '../../utils/toast';
import api from '../../lib/api';

const RestaurantRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    confirmPassword: '',
    restaurantType: 'Restaurant',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      restaurantName: name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.adminPassword !== formData.confirmPassword) {
      showToast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      // Use the calculated slug 
      const payload = {
        ...formData,
      };

      // Post to /tenants/register (baseURL already includes /api)
      await api.post('/tenants/register', payload);

      showToast.success('Compte créé avec succès !');

      // Redirect to login page
      navigate('/login');

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Erreur lors de l\'inscription';
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white px-4">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-4 relative z-10 my-8">
        <div className="text-center group cursor-pointer" onClick={() => navigate('/')}>
          <div className="mx-auto transform group-hover:rotate-6 transition-transform duration-500">
            <img src="/logo_dark.png" alt="GoTchop" className="h-16 md:h-24 mx-auto" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-black text-white tracking-tight leading-tight">
            Rejoignez l'Élite <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Restaurateurs.</span>
          </h2>
          <p className="mt-1 text-center text-xs text-gray-400">
            Commencez à vendre en quelques minutes.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 py-5 md:py-6 px-4 shadow-2xl rounded-2xl sm:px-8 relative overflow-hidden">
          {/* Gradient Border Top */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 to-red-600 opacity-50" />

          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Restaurant Info */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Votre Établissement</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="restaurantName" className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Nom du Restaurant
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="restaurantName"
                      name="restaurantName"
                      type="text"
                      required
                      className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                      placeholder="Ma Boulangerie, Mon Fast-Food..."
                      value={formData.restaurantName}
                      onChange={handleNameChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="slug" className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Lien de votre boutique
                  </label>
                  <div className="flex bg-black/50 border border-white/10 rounded-xl overflow-hidden focus-within:border-orange-500 transition-colors">
                    <span className="inline-flex items-center px-4 border-r border-white/10 bg-white/5 text-gray-400 text-sm font-medium">
                      gotchop.com/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      id="slug"
                      required
                      className="flex-1 block w-full bg-transparent border-0 py-3 px-3 text-white focus:ring-0 sm:text-sm placeholder-gray-600"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="restaurantType" className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Type de Commerce
                  </label>
                  <select
                    id="restaurantType"
                    name="restaurantType"
                    value={formData.restaurantType}
                    onChange={(e) => setFormData({ ...formData, restaurantType: e.target.value })}
                    className="block w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                  >
                    <option value="Restaurant Traditionnel">Restaurant Traditionnel</option>
                    <option value="Fast-Food / Snack">Fast-Food / Snack</option>
                    <option value="Boulangerie / Pâtisserie">Boulangerie / Pâtisserie</option>
                    <option value="Pizzeria">Pizzeria</option>
                    <option value="Café / Salon de Thé">Café / Salon de Thé</option>
                    <option value="Dark Kitchen (livraison uniquement)">Dark Kitchen (livraison uniquement)</option>
                    <option value="Food Truck">Food Truck</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Admin Info */}
            <div className="pt-4">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Administrateur</h3>
              <div className="space-y-4">

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nom Complet</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                      placeholder="Jean Dupont"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="email"
                        required
                        className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                        placeholder="jean@example.com"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Téléphone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="tel"
                        className="block w-full pl-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                        placeholder="+225..."
                        value={formData.adminPhone}
                        onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Mot de passe</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="block w-full pl-10 pr-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                        placeholder="********"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Confirmation</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="block w-full pl-10 pr-10 bg-black/50 border border-white/10 rounded-lg py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                        placeholder="********"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transform transition-all hover:-translate-y-1 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Création en cours...' : 'Lancer mon activité'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500 mb-3">Déjà partenaire ?</p>
            <a
              href="/login"
              className="inline-flex items-center text-sm font-bold text-white hover:text-orange-500 transition-colors"
            >
              Se connecter au dashboard <ArrowRight className="ml-1 w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantRegistrationPage;
