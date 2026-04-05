// @ts-nocheck
import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, Upload, Users, AlertCircle, Phone, Mail, ShieldCheck, ChevronRight, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl, cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useSubscription } from '../../hooks/useSubscription';
import UpgradeModal from '../../components/UpgradeModal';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  isActive: boolean;
  avatar?: string;
}

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
    const data = new FormData();
    data.append('email', formData.email);
    data.append('fullName', formData.fullName);
    data.append('role', formData.role);
    if (formData.phone) data.append('phone', formData.phone);
    if (formData.password) data.append('password', formData.password);
    if (avatarFile) data.append('avatar', avatarFile);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (currentUser?.id) {
        if (!formData.password) data.delete('password');
        await api.patch(`/admin/users/${currentUser.id}`, data, config);
        toast.success("Membre mis à jour");
      } else {
        await api.post('/admin/users', data, config);
        toast.success("Membre créé");
      }
      setIsModalOpen(false);
      refetch();
      if (currentUser?.id === authUser?.id) window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous supprimer ce membre ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Membre supprimé");
      refetch();
    } catch (error: any) {
      toast.error("Erreur: " + (error.response?.data?.message || error.message));
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

  if (loading && !usersData) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-stone-200 animate-spin" />
        <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Chargement de l'équipe...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-4 sm:p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30 pointer-events-none"></div>

        <div className="flex items-center gap-4 md:gap-6 relative z-10">
          <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
            <Users className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base xs:text-xl sm:text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Staff & Clients</h1>
            <p className="text-[10px] md:text-sm font-bold mt-2 truncate tracking-wide uppercase text-stone-400">Annuaire des utilisateurs</p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10 shrink-0">
          <button
            onClick={() => openModal()}
            disabled={isLimitReached}
            className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 flex flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Membre</span>
          </button>
        </div>
      </div>

      {/* Grid view (Surgery) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {usersData?.data.map((user, idx) => (
          <div
            key={user.id}
            className="group bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 hover:-translate-y-1 transition-all duration-500 relative flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 overflow-hidden"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-12 -mt-12 transition-colors group-hover:bg-stone-100"></div>

            <div className="flex flex-col items-center text-center relative z-10 mb-6">
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner overflow-hidden mb-4 border transition-all duration-500 group-hover:scale-105 group-hover:border-stone-200",
                user.avatar ? "bg-white border-stone-100" : "bg-stone-50 text-stone-300 border-transparent"
              )}>
                {user.avatar ? (
                  <img src={getImageUrl(user.avatar)!} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              <div className="w-full px-2">
                <h3 className="font-black text-stone-900 text-base truncate mb-1 leading-tight uppercase tracking-tight">{user.fullName}</h3>
                <div className="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Mail className="w-3 h-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest truncate">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-auto relative z-10 w-full">
              {/* Role & Phone - High Density */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-100/50 flex flex-col items-center justify-center text-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-stone-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-900 truncate w-full">
                    {user.role === 'super_admin' ? 'Super Admin' : user.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-100/50 flex flex-col items-center justify-center text-center gap-1">
                  <Phone className="w-3 h-3 text-stone-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-900 truncate w-full">
                    {user.phone || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Actions - Modern Styled */}
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(user)}
                  className="flex-1 bg-stone-900 text-white h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-stone-100"
                >
                  <Pencil className="w-3 h-3" />
                  Modifier
                </button>
                {user.id !== authUser?.id && (
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="w-11 h-11 bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center active:scale-95 transition-all group-hover:border-stone-200 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Modal Overhaul */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentUser ? 'Profil Membre' : 'Nouvelle Recrue'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative group cursor-pointer w-28 h-28 rounded-3xl bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden hover:border-stone-900 transition-colors"
              onClick={() => document.getElementById('avatar-input')?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-300" />
              ) : (
                <Upload className="w-8 h-8 text-stone-300 transition-transform group-hover:scale-110" />
              )}
              <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Choisir Image</span>
              </div>
            </div>
            <p className="text-[10px] font-bold text-stone-400 mt-4 uppercase tracking-widest">Avatar d'équipe • Max 2Mo</p>
            <input id="avatar-input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NOM COMPLET"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="h-14 font-black uppercase tracking-widest text-xs"
            />
            <Input
              label="EMAIL D'ACCÈS"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-14 font-black uppercase tracking-widest text-xs"
            />
          </div>

          {currentUser && formData.email !== currentUser.email && (
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-orange-900 uppercase tracking-tight mb-1">Attention ID Changé</p>
                <p className="text-[10px] text-orange-700/70 font-bold uppercase tracking-wide">La connexion se fera avec ce nouvel email.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={currentUser ? "NOUVEAU MOT DE PASSE" : "MOT DE PASSE"}
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required={!currentUser}
              placeholder={currentUser ? "Laisser vide..." : ""}
              className="h-14 font-black tracking-widest text-xs"
            />
            <Input
              label="MOBILE / CONTACT"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: 01 23 45 67 89"
              className="h-14 font-black uppercase tracking-widest text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Rôle au sein de l'établissement</label>
            <select
              className={cn(
                "w-full h-14 px-6 bg-stone-50 rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black uppercase tracking-widest text-xs appearance-none transition-all",
                currentUser?.id === authUser?.id && "opacity-50 cursor-not-allowed bg-stone-100"
              )}
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              disabled={currentUser?.id === authUser?.id}
            >
              <option value="serveur">Serveur / Salle</option>
              <option value="caissier">Caissier / Caisse</option>
              <option value="salle">Gérant de Salle</option>
              <option value="livreur">Livreur / Externe</option>
              <option value="comptable">Comptabilité</option>
              <option value="admin">Administrateur</option>
            </select>
            {currentUser?.id === authUser?.id && (
              <div className="flex items-center gap-2 ml-1 opacity-40">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest italic">Auto-modification de rôle restreinte</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl" disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" isLoading={submitting} className="flex-1 h-14 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200">
              Enregistrer
            </Button>
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
