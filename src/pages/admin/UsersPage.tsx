import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, Upload, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../lib/utils';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  isActive: boolean;
  avatar?: string;
}

import { useSubscription } from '../../hooks/useSubscription';
import UpgradeModal from '../../components/UpgradeModal';

export default function UsersPage() {
  const { data: usersData, loading, refetch } = useFetch<{ meta: any, data: User[] }>('/admin/users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);

  const [formData, setFormData] = useState({ email: '', fullName: '', password: '', role: 'serveur', phone: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const { user: authUser } = useAuth();
  const { isStaffLimitReached, maxStaff, planName } = useSubscription();

  const currentCount = usersData?.data?.length || 0;
  const isLimitReached = isStaffLimitReached(currentCount);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validation simple de la taille (ex: 2Mo)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max 2Mo)");
        return;
      }

      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Use FormData for file upload
    const data = new FormData();
    data.append('email', formData.email);
    data.append('fullName', formData.fullName);
    data.append('role', formData.role);
    if (formData.phone) data.append('phone', formData.phone);
    if (formData.password) data.append('password', formData.password);

    if (avatarFile) {
      data.append('avatar', avatarFile);
    }

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (currentUser?.id) {
        // Update
        if (!formData.password) data.delete('password');
        await api.patch(`/admin/users/${currentUser.id}`, data, config);
        toast.success("Membre mis à jour avec succès");

        // Si c'est l'utilisateur actuel qui se met à jour, on rafraîchit le contexte global
        if (currentUser.id === authUser?.id) {
          // Si c'est l'utilisateur actuel qui se met à jour, on rafraîchit le contexte global
        }
      } else {
        // Create
        await api.post('/admin/users', data, config);
        toast.success("Membre créé avec succès");
      }
      setIsModalOpen(false);
      refetch();

      // Important: refresh auth user if modified
      if (currentUser?.id === authUser?.id) {
        window.location.reload(); // Simple but effective to refresh all contexts if it's the current user
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'enregistrement';
      const status = error.response?.status;

      if (status === 413) {
        toast.error("Le fichier est trop lourd pour le serveur");
      } else if (status === 403) {
        toast.error("Vous n'avez pas les permissions pour cette action");
      } else {
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Membre supprimé avec succès");
      refetch();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression : " + (error.response?.data?.message || error.message));
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        email: user.email,
        fullName: user.fullName,
        password: '',
        role: user.role,
        phone: user.phone || ''
      });
      setPreviewUrl(getImageUrl(user.avatar));
      setAvatarFile(null);
    } else {
      if (isLimitReached) {
        setUpgradeModalOpen(true);
        return;
      }
      setCurrentUser(null);
      setFormData({ email: '', fullName: '', password: '', role: 'serveur', phone: '' });
      setPreviewUrl(null);
      setAvatarFile(null);
    }
    setIsModalOpen(true);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 relative z-10 w-full xs:w-auto">
          <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-xl shadow-purple-100 shrink-0 self-start md:self-center">
            <Users className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-stone-900 flex items-center gap-2 uppercase tracking-tight font-display">
              <span className="truncate text-stone-900">Équipe</span>
            </h1>
            <p className="text-stone-400 text-xs md:text-sm font-bold mt-1 md:mt-2 truncate">
              {currentCount} / {maxStaff} membres utilisés
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0 relative z-10">
          <Button
            onClick={() => openModal()}
            disabled={isLimitReached}
            title={isLimitReached ? "Limite atteinte" : "Ajouter"}
            className="flex-1 sm:flex-none h-11 md:h-14 px-6 md:px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-200 rounded-2xl font-bold uppercase tracking-wider text-[10px] md:text-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Ajouter un membre</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
        {usersData?.data.map(user => (
          <div key={user.id} className="group bg-white rounded-3xl p-4 md:p-5 border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative flex flex-col h-full overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-12 -mt-12 group-hover:bg-purple-50 transition-colors"></div>

            {/* User Info */}
            <div className="flex flex-col items-center text-center mb-5 relative z-10">
              <div className={`
                        w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black shadow-inner overflow-hidden mb-3
                        ${user.avatar ? 'bg-white border-2 border-stone-100' :
                  user.role === 'admin' || user.role === 'super_admin' ? 'bg-purple-100 text-purple-600' :
                    user.role === 'livreur' ? 'bg-yellow-100 text-yellow-600' :
                      user.role === 'comptable' ? 'bg-slate-100 text-slate-600' : 'bg-gray-100 text-gray-600'}
                      `}>
                {user.avatar ? (
                  <img src={getImageUrl(user.avatar)!} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              <div className="w-full px-2">
                <h3 className="font-black text-stone-900 text-sm md:text-base truncate leading-none mb-1">{user.fullName}</h3>
                <p className="text-[10px] md:text-xs font-medium text-stone-400 truncate opacity-80">{user.email}</p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex justify-center mb-4 relative z-10">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-sm
                  ${user.role === 'super_admin' ? 'bg-purple-600 text-white' :
                  user.role === 'admin' ? 'bg-blue-500 text-white' :
                    user.role === 'salle' ? 'bg-emerald-500 text-white' :
                      user.role === 'caissier' ? 'bg-orange-500 text-white' :
                        user.role === 'livreur' ? 'bg-yellow-500 text-white' :
                          user.role === 'comptable' ? 'bg-slate-600 text-white' : 'bg-stone-100 text-stone-600'}
               `}>
                {user.role === 'super_admin' ? 'Super Admin' : user.role.replace('_', ' ')}
              </span>
            </div>

            {/* Phone Info */}
            <div className="mt-auto mb-4 relative z-10 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-100/50 group-hover:bg-white transition-colors">
                <span className="text-[10px]">📱</span>
                {user.phone ? <span className="text-[10px] md:text-xs font-black text-stone-700">{user.phone}</span> : <span className="text-[10px] text-stone-400 italic font-medium">Aucun contact</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 relative z-10">
              <button
                onClick={() => openModal(user)}
                className="flex-1 bg-stone-900 text-white py-2.5 rounded-xl hover:bg-black text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-stone-100"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </button>
              {user.id !== authUser?.id && (
                <button
                  onClick={() => handleDelete(user.id)}
                  className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 flex items-center justify-center active:scale-95 transition-all border border-rose-100 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentUser ? 'Modifier le membre' : 'Ajouter un membre'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input')?.click()}>
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold">Modifier</span>
              </div>
            </div>
            <input
              id="avatar-input"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <Input
            label="Nom complet"
            value={formData.fullName}
            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />

          {currentUser && formData.email !== currentUser.email && (
            <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Attention : Changement d'identifiant</p>
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                  Le changement de l'email modifiera l'identifiant de connexion de ce membre.
                  Il devra utiliser cette nouvelle adresse pour accéder à son compte.
                </p>
              </div>
            </div>
          )}
          {!currentUser && (
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}
          {currentUser && (
            <Input
              label="Nouveau mot de passe (laisser vide pour ne pas changer)"
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          )}
          <Input
            label="Téléphone"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentUser?.id === authUser?.id ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              disabled={currentUser?.id === authUser?.id}
            >
              <option value="serveur">Serveur</option>
              <option value="caissier">Caissier</option>
              <option value="salle">Chef de Salle</option>
              <option value="livreur">Livreur</option>
              <option value="comptable">Comptable</option>
              <option value="admin">Administrateur</option>
            </select>
            {currentUser?.id === authUser?.id && (
              <p className="text-[10px] text-gray-400 mt-1 italic">Vous ne pouvez pas modifier votre propre rôle.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" isLoading={submitting}>Enregistrer</Button>
          </div>
        </form>
      </Modal>


      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName="Staff Illimité"
        description={`Votre plan actuel (${planName}) est limité à ${maxStaff} membres d'équipe.`}
      />
    </div>
  );
}
