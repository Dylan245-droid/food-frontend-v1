import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Smartphone, ArrowRight, Pizza, UtensilsCrossed, Star, Coffee, ShoppingBag } from 'lucide-react';

const SaasLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-xl shadow-lg shadow-orange-200">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900 tracking-tight">RestoPlatform</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                Espace Client
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Créer mon compte
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-semibold mb-6 border border-orange-100">
                <Star className="w-4 h-4 fill-current" />
                <span>La plateforme préférée des commerçants</span>
              </div>
              <h1 className="text-5xl tracking-tight font-extrabold text-gray-900 sm:text-6xl md:text-7xl mb-6">
                <span className="block">La solution de commande</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
                  pour tous les commerces
                </span>
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 mb-10">
                Que vous soyez une <span className="text-gray-900 font-semibold">boulangerie</span>, un <span className="text-gray-900 font-semibold">fast-food</span> ou un <span className="text-gray-900 font-semibold">restaurant gastronomique</span>,
                RestoPlatform s'adapte à votre métier pour booster vos ventes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-xl hover:shadow-2xl hover:shadow-orange-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Commencer l'essai gratuit
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/r/restaurant-principal/menu')}
                  className="px-8 py-4 border-2 border-gray-200 text-lg font-bold rounded-full text-gray-700 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  Voir une démo live
                </button>
              </div>
            </div>
          </div>

          {/* Abstract Background Shapes */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full overflow-hidden -z-10 selection:bg-orange-100">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/30 rounded-full blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-pink-200/30 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          </div>
        </div>

        {/* Business Types Section - "Le SAAS qui pue le commerce" */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                Conçu pour <span className="text-orange-600">votre</span> activité
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Chaque commerce a ses spécificités. Nous avons créé des expériences sur-mesure pour chacun d'eux.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Card 1: Fast Food */}
              <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-100 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Pizza className="w-24 h-24 text-orange-500 transform rotate-12 group-hover:scale-110 transition-transform" />
                </div>
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Pizza className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Snack & Fast Food</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  Bornes de commande, écrans cuisine (KDS) et click & collect ultra-rapide pour gérer le flux.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-md font-medium">Burger & Co.</span>
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-md font-medium">Tacos King</span>
                </div>
              </div>

              {/* Card 2: Boulangerie */}
              <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-yellow-100 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Coffee className="w-24 h-24 text-yellow-600 transform -rotate-12 group-hover:scale-110 transition-transform" />
                </div>
                <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-700 mb-6 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                  <Coffee className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Boulangerie</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  Gestion des formules midi, pré-commande pour éviter la file et fidélité intégrée.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-md font-medium">L'Épi d'Or</span>
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-md font-medium">Maison Dupont</span>
                </div>
              </div>

              {/* Card 3: Restaurant */}
              <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-red-100 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <UtensilsCrossed className="w-24 h-24 text-red-600 transform rotate-6 group-hover:scale-110 transition-transform" />
                </div>
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <UtensilsCrossed className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Restaurant</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  Menu QR code sur table, réservation de table et paiement à table sans TPE.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-md font-medium">Le Bistrot</span>
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-md font-medium">La Table Rouge</span>
                </div>
              </div>

              {/* Card 4: Dark Kitchen / Delivery */}
              <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-100 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShoppingBag className="w-24 h-24 text-purple-600 transform -rotate-12 group-hover:scale-110 transition-transform" />
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Dark Kitchen</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  Optimisé pour la livraison. Agrégateur de plateformes et suivi livreurs en temps réel.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-md font-medium">Ghost Burger</span>
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-md font-medium">Sushi Lab</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features - "Tout ce qu'il faut" */}
        <div className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
                  Une seule plateforme,<br /> des possibilités infinies
                </h2>
                <p className="text-lg text-gray-500 mb-8">
                  Ne jonglez plus entre 5 logiciels différents. RestoPlatform centralise tout votre écosystème commercial.
                </p>

                <dl className="space-y-6">
                  {[
                    { label: 'Menu Digital Dynamique', text: 'Changez vos prix et produits en 1 clic partout.' },
                    { label: 'Gestion de Commandes', text: 'Centralisez toutes vos commandes (Sur place, Livraison, Emporté) sur un seul écran.' },
                    { label: 'Marketing Automatisé', text: 'Relancez vos clients par SMS et notifications.' },
                    { label: 'Rapports Détaillés', text: 'Suivez votre CA et vos marges en temps réel.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                      <div>
                        <dt className="text-base font-bold text-gray-900">{item.label}</dt>
                        <dd className="text-sm text-gray-500">{item.text}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="mt-12 lg:mt-0 relative">
                {/* Simulated Dashboard UI */}
                <div className="bg-gray-900 rounded-2xl shadow-2xl p-4 transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-gray-800">
                  <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="ml-auto text-xs text-gray-400 font-mono">dashboard.restoplatform.com</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-gray-400">Ventes du jour</div>
                      <div className="text-xl font-bold text-white">1,240 €</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-gray-400">Commandes</div>
                      <div className="text-xl font-bold text-white">42</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-gray-400">Livreurs</div>
                      <div className="text-xl font-bold text-green-400">5 Actifs</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-gray-800 p-3 rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-700"></div>
                        <div className="flex-1">
                          <div className="h-2 w-24 bg-gray-700 rounded mb-1"></div>
                          <div className="h-2 w-16 bg-gray-700 rounded"></div>
                        </div>
                        <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Payé</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
            <div className="flex justify-center space-x-6 md:order-2">
              <span className="text-gray-400 hover:text-gray-500 cursor-pointer">Aide</span>
              <span className="text-gray-400 hover:text-gray-500 cursor-pointer">Tarifs</span>
              <span className="text-gray-400 hover:text-gray-500 cursor-pointer">Contact</span>
            </div>
            <div className="mt-8 md:mt-0 md:order-1 flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-400" />
              <p className="text-center text-base text-gray-400">
                &copy; 2026 RestoPlatform. Made with ❤️ for businesses.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default SaasLandingPage;
