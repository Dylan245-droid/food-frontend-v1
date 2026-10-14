# 🍽️ GoTchop Web — Frontend SaaS & Portail Restauration

> **Interface web moderne, ultra-rapide et responsive pour la gestion de restaurants, la commande sur table et le dispatch de livraisons.**  
> Développé avec **React 19**, **Vite 7**, **TypeScript** et **Tailwind CSS v4**.

---

## 📱 Espaces & Expériences Dédiés

L'application regroupe plusieurs interfaces spécialisées au sein d'un même projet :

### 1. 🍽️ Expérience Client & Prise de Commande (Mobile-First)
- **Commande à Table (Dine-In)** : Scan de QR Code unique par table, panier interactif, options de personnalisation et suivi du statut de préparation.
- **Vente à Emporter (Takeout)** : Menu complet avec génération de code de retrait à 6 caractères et tracking en direct.
- **Réservation de Tables** : Module public de réservation avec confirmation instantanée.
- **Appel Serveur** : Boutons d'appel d'urgence (demande d'addition 💳, carafe d'eau 💧, aide 🔔).

### 2. 🏪 Back-Office Restaurant (Admin & Salle)
- **Tableau de Bord KPI** : Ventes du jour, chiffre d'affaires, panier moyen et top des plats vendus ([Recharts](https://recharts.org)).
- **Cuisine & Commandes (KDS)** : Affichage optimisé des bons en attente, en préparation et prêts à servir avec alertes sonores.
- **Gestion des Salles & Tables** : Visualisation en grille, statuts d'occupation en temps réel et assignation de serveurs.
- **Module Caisse & Encaissements** : Clôtures de caisse (Z de caisse), mouvements d'espèces, transferts et tickets de caisse imprimables.
- **Gestion des Stocks** : Inventaires, fiches techniques de plats et alertes de rupture.
- **Finances & Factures** : Grand livre comptable, journaux et export de factures.

### 3. 🛵 Espace Livreurs & Dispatch
- Interface mobile dédiée aux coursiers avec géolocalisation en direct ([Mapbox GL](https://www.mapbox.com/)).
- Dispatching des courses web aux livreurs disponibles et validation des livraisons par code client.

### 4. 👑 Super Admin SaaS (Plateforme GoTchop)
- Vue panoramique « God's Eye » sur tous les restaurants actifs.
- Gestion des abonnements SaaS (Essentiel, Pro, Elite), facturation des forfaits et suivi des revenus récurrents.

---

## 🛠️ Stack Technique

| Technologie | Rôle |
|---|---|
| **React 19** | Bibliothèque UI réactive dernière génération |
| **Vite 7** | Bundler ultra-rapide avec HMR |
| **Tailwind CSS v4** | Moteur de styles moderne et personnalisé |
| **TypeScript** | Typage statique strict et sécurité du code |
| **Lucide React** | Pack d'icônes vectorielles cohérent et épuré |
| **Sonner** | Système de notifications toast riches et interactives |
| **Mapbox GL** | Cartographie interactive et géolocalisation des courses |
| **Recharts** | Visualisations de données et graphiques financiers |
| **Service Worker** | Mise en cache hors-ligne et réceptions Web Push |

---

## 📂 Architecture des Dossiers

```
frontend/src/
├── components/          # Composants réutilisables (Layouts, Badges, Modales, Tickets)
│   ├── AdminLayout.tsx       # Structure principale de l'administration
│   ├── SyncStatusBadge.tsx   # Badge de statut hors-ligne / en ligne
│   └── PublicLayout.tsx      # Structure des pages publiques restaurant
├── context/             # États globaux React
│   ├── AuthContext.tsx        # Session utilisateur & gestion des rôles
│   ├── BrandingContext.tsx    # Personnalisation visuelle du restaurant (logo, couleurs)
│   ├── NotificationContext.tsx# Gestion SSE & Web Push
│   └── SearchContext.tsx      # Recherche rapide globale
├── lib/
│   ├── api.ts                # Client Axios avec détection automatique d'IP locale
│   └── utils.ts              # Helpers de formatage (monnaies, dates, classes)
└── pages/
    ├── admin/           # Pages d'administration (Caisse, Commandes, Menu, Tables, Stocks...)
    ├── client/          # Pages clients (DineIn, Takeout, Booking, Tracking)
    ├── delivery/        # Dashboard livreur & suivi GPS
    ├── saas/            # Landing page GoTchop, tarification, inscription
    └── super-admin/     # Back-office de gestion multi-restaurants
```

---

## 🚀 Démarrage

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration d'environnement
Créez un fichier `.env` à la racine de `frontend/` :
```env
# URL de l'API Backend
VITE_API_URL=http://localhost:9015/api

# Clé Mapbox (pour les cartes de livraison)
VITE_MAPBOX_ACCESS_TOKEN=votre_cle_mapbox

# Clé publique Web Push VAPID
VITE_VAPID_PUBLIC_KEY=votre_cle_vapid
```

### 3. Lancement du serveur de développement
```bash
npm run dev
```
L'application démarre sur `http://localhost:5173`.

---

## 🔌 Résilience & Fonctionnement Hors-Ligne

- **Résolution Automatique d'IP** : Lorsqu'une tablette de serveur ou un smartphone se connecte au Wi-Fi local du restaurant (ex: `http://192.168.1.50:5173`), l'application détecte automatiquement l'IP de la caisse locale sans nécessiter de configuration manuelle.
- **Service Worker & Cache PWA** : Grâce à `public/sw.js`, les pages et scripts restent disponibles en local même si le routeur redémarre ou que la liaison Internet externe est coupée.
- **Badge de Synchronisation** : Un indicateur visuel en haut à droite permet au personnel de vérifier l'état du serveur local et de déclencher manuellement une synchronisation vers le Cloud en 1 clic.

---

## 📦 Build de Production

```bash
# Vérification TypeScript
npm run build

# Prévisualisation du bundle de production
npm run preview
```
Le dossier généré `dist/` est prêt à être servi par Nginx ou hébergé sur le serveur VPS.
